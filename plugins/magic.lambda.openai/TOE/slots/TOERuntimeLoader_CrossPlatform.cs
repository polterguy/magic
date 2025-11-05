/**
 * TOE Runtime Loader - CROSS-PLATFORM VERSION
 * Automatically detects Linux vs Mac and loads appropriate binaries
 *
 * Francesco Pedulli, November 3, 2025
 * For Thomas Hansen / Magic Platform
 */

using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading;

namespace Magic.Lambda.OpenAI.TOE
{
    /// <summary>
    /// Cross-platform TOE runtime loader with automatic platform detection
    /// Supports: Linux (ELF .so) and Mac (Mach-O .dylib)
    /// </summary>
    public class TOERuntimeLoader : IDisposable
    {
        #region Platform Detection

        /// <summary>
        /// Detected operating system platform
        /// </summary>
        public enum OSPlatform
        {
            Unknown,
            Linux,
            Mac,
            Windows
        }

        /// <summary>
        /// Get current OS platform
        /// </summary>
        private static OSPlatform GetPlatform()
        {
            if (RuntimeInformation.IsOSPlatform(System.Runtime.InteropServices.OSPlatform.Linux))
                return OSPlatform.Linux;

            if (RuntimeInformation.IsOSPlatform(System.Runtime.InteropServices.OSPlatform.OSX))
                return OSPlatform.Mac;

            if (RuntimeInformation.IsOSPlatform(System.Runtime.InteropServices.OSPlatform.Windows))
                return OSPlatform.Windows;

            return OSPlatform.Unknown;
        }

        private static readonly OSPlatform CurrentPlatform = GetPlatform();

        /// <summary>
        /// Get platform-specific library extension
        /// </summary>
        private static string GetLibraryExtension()
        {
            return CurrentPlatform switch
            {
                OSPlatform.Linux => ".so",
                OSPlatform.Mac => ".dylib",
                OSPlatform.Windows => ".dll",
                _ => throw new PlatformNotSupportedException($"Platform {CurrentPlatform} not supported")
            };
        }

        /// <summary>
        /// Get platform-specific binary directory
        /// </summary>
        private static string GetBinaryDirectory(string baseDir)
        {
            return CurrentPlatform switch
            {
                OSPlatform.Linux => Path.Combine(baseDir, "linux"),
                OSPlatform.Mac => Path.Combine(baseDir, "mac"),
                OSPlatform.Windows => Path.Combine(baseDir, "windows"),
                _ => baseDir // Fallback to base directory
            };
        }

        #endregion

        #region P/Invoke Declarations - PLATFORM-SPECIFIC

        // On Linux: DllImport("toe_runtime.so")
        // On Mac:   DllImport("toe_runtime.dylib")
        // We use const string to allow runtime selection

        private const string RUNTIME_LIB_LINUX = "toe_runtime.so";
        private const string RUNTIME_LIB_MAC = "toe_runtime.dylib";
        private const string RUNTIME_LIB_WINDOWS = "toe_runtime.dll";

        /// <summary>
        /// Get runtime library name for current platform
        /// </summary>
        private static string GetRuntimeLibrary()
        {
            return CurrentPlatform switch
            {
                OSPlatform.Linux => RUNTIME_LIB_LINUX,
                OSPlatform.Mac => RUNTIME_LIB_MAC,
                OSPlatform.Windows => RUNTIME_LIB_WINDOWS,
                _ => throw new PlatformNotSupportedException($"Platform {CurrentPlatform} not supported")
            };
        }

        //-----------------------------------------------------------------------------
        // LINUX P/INVOKE
        //-----------------------------------------------------------------------------

        #if LINUX || UNITY_STANDALONE_LINUX
        [DllImport("toe_runtime.so", CallingConvention = CallingConvention.Cdecl)]
        private static extern IntPtr toe_load_phase(string toe_path, string key, int phase);

        [DllImport("toe_runtime.so", CallingConvention = CallingConvention.Cdecl)]
        private static extern int toe_compress_vector(IntPtr phase_handle,
            [In] float[] vector, int size, [Out] byte[] compressed, int max_output);

        [DllImport("toe_runtime.so", CallingConvention = CallingConvention.Cdecl)]
        private static extern double toe_distance(IntPtr phase_handle,
            [In] byte[] compressed_a, int size_a, [In] byte[] compressed_b, int size_b);

        [DllImport("toe_runtime.so", CallingConvention = CallingConvention.Cdecl)]
        private static extern void toe_unload_phase(IntPtr phase_handle);
        #endif

        //-----------------------------------------------------------------------------
        // MAC P/INVOKE
        //-----------------------------------------------------------------------------

        #if OSX || UNITY_STANDALONE_OSX
        [DllImport("toe_runtime.dylib", CallingConvention = CallingConvention.Cdecl)]
        private static extern IntPtr toe_load_phase(string toe_path, string key, int phase);

        [DllImport("toe_runtime.dylib", CallingConvention = CallingConvention.Cdecl)]
        private static extern int toe_compress_vector(IntPtr phase_handle,
            [In] float[] vector, int size, [Out] byte[] compressed, int max_output);

        [DllImport("toe_runtime.dylib", CallingConvention = CallingConvention.Cdecl)]
        private static extern double toe_distance(IntPtr phase_handle,
            [In] byte[] compressed_a, int size_a, [In] byte[] compressed_b, int size_b);

        [DllImport("toe_runtime.dylib", CallingConvention = CallingConvention.Cdecl)]
        private static extern void toe_unload_phase(IntPtr phase_handle);
        #endif

        //-----------------------------------------------------------------------------
        // RUNTIME P/INVOKE WRAPPER (Detects platform at runtime)
        //-----------------------------------------------------------------------------

        // For platforms without compile-time detection, we use NativeLibrary (NET 5.0+)
        #if !LINUX && !OSX && !UNITY_STANDALONE_LINUX && !UNITY_STANDALONE_OSX

        private static IntPtr _runtimeLibHandle = IntPtr.Zero;
        private static readonly object _loadLock = new object();

        private delegate IntPtr LoadPhaseDelegate(string toe_path, string key, int phase);
        private delegate int CompressVectorDelegate(IntPtr phase_handle, float[] vector, int size, byte[] compressed, int max_output);
        private delegate double DistanceDelegate(IntPtr phase_handle, byte[] compressed_a, int size_a, byte[] compressed_b, int size_b);
        private delegate void UnloadPhaseDelegate(IntPtr phase_handle);

        private static LoadPhaseDelegate _toe_load_phase;
        private static CompressVectorDelegate _toe_compress_vector;
        private static DistanceDelegate _toe_distance;
        private static UnloadPhaseDelegate _toe_unload_phase;

        /// <summary>
        /// Load native library dynamically
        /// </summary>
        private static void EnsureRuntimeLoaded()
        {
            if (_runtimeLibHandle != IntPtr.Zero)
                return;

            lock (_loadLock)
            {
                if (_runtimeLibHandle != IntPtr.Zero)
                    return;

                string libraryName = GetRuntimeLibrary();
                string libraryPath = FindRuntimeLibrary(libraryName);

                if (!File.Exists(libraryPath))
                {
                    throw new FileNotFoundException(
                        $"TOE runtime library not found: {libraryPath}\n" +
                        $"Platform: {CurrentPlatform}\n" +
                        $"Expected library: {libraryName}\n" +
                        "Please ensure the correct platform binaries are deployed.");
                }

                // Load library
                _runtimeLibHandle = NativeLibrary.Load(libraryPath);

                // Load function pointers
                _toe_load_phase = Marshal.GetDelegateForFunctionPointer<LoadPhaseDelegate>(
                    NativeLibrary.GetExport(_runtimeLibHandle, "toe_load_phase"));

                _toe_compress_vector = Marshal.GetDelegateForFunctionPointer<CompressVectorDelegate>(
                    NativeLibrary.GetExport(_runtimeLibHandle, "toe_compress_vector"));

                _toe_distance = Marshal.GetDelegateForFunctionPointer<DistanceDelegate>(
                    NativeLibrary.GetExport(_runtimeLibHandle, "toe_distance"));

                _toe_unload_phase = Marshal.GetDelegateForFunctionPointer<UnloadPhaseDelegate>(
                    NativeLibrary.GetExport(_runtimeLibHandle, "toe_unload_phase"));
            }
        }

        /// <summary>
        /// Find runtime library in various possible locations
        /// </summary>
        private static string FindRuntimeLibrary(string libraryName)
        {
            // Strategy 1: Next to this assembly
            string assemblyDir = Path.GetDirectoryName(typeof(TOERuntimeLoader).Assembly.Location);
            string path1 = Path.Combine(assemblyDir, "TOE", "binaries", libraryName);
            if (File.Exists(path1)) return path1;

            // Strategy 2: Platform-specific subdirectory
            string platformDir = GetBinaryDirectory(Path.Combine(assemblyDir, "TOE", "binaries"));
            string path2 = Path.Combine(platformDir, libraryName);
            if (File.Exists(path2)) return path2;

            // Strategy 3: System library path (LD_LIBRARY_PATH, DYLD_LIBRARY_PATH)
            string path3 = libraryName; // Let the system find it
            if (File.Exists(path3)) return path3;

            // Strategy 4: Current directory
            string path4 = Path.Combine(Directory.GetCurrentDirectory(), libraryName);
            if (File.Exists(path4)) return path4;

            // Not found - return most likely path for error message
            return path2;
        }

        /// <summary>
        /// Wrapper methods that use dynamic delegates
        /// </summary>
        private static IntPtr toe_load_phase_dynamic(string toe_path, string key, int phase)
        {
            EnsureRuntimeLoaded();
            return _toe_load_phase(toe_path, key, phase);
        }

        private static int toe_compress_vector_dynamic(IntPtr phase_handle, float[] vector, int size, byte[] compressed, int max_output)
        {
            EnsureRuntimeLoaded();
            return _toe_compress_vector(phase_handle, vector, size, compressed, max_output);
        }

        private static double toe_distance_dynamic(IntPtr phase_handle, byte[] compressed_a, int size_a, byte[] compressed_b, int size_b)
        {
            EnsureRuntimeLoaded();
            return _toe_distance(phase_handle, compressed_a, size_a, compressed_b, size_b);
        }

        private static void toe_unload_phase_dynamic(IntPtr phase_handle)
        {
            EnsureRuntimeLoaded();
            _toe_unload_phase(phase_handle);
        }

        #endif

        #endregion

        #region High-Level API

        private IntPtr _phaseHandle = IntPtr.Zero;
        private readonly int _phase;
        private readonly string _encryptionKey;
        private bool _disposed = false;

        // Lazy singleton instances for each phase
        private static readonly Lazy<TOERuntimeLoader> _phase1 = new Lazy<TOERuntimeLoader>(
            () => new TOERuntimeLoader(1), LazyThreadSafetyMode.ExecutionAndPublication);

        private static readonly Lazy<TOERuntimeLoader> _phase2 = new Lazy<TOERuntimeLoader>(
            () => new TOERuntimeLoader(2), LazyThreadSafetyMode.ExecutionAndPublication);

        private static readonly Lazy<TOERuntimeLoader> _phase3 = new Lazy<TOERuntimeLoader>(
            () => new TOERuntimeLoader(3), LazyThreadSafetyMode.ExecutionAndPublication);

        /// <summary>
        /// Get Phase 1 runtime (5.15× compression)
        /// </summary>
        public static TOERuntimeLoader Phase1 => _phase1.Value;

        /// <summary>
        /// Get Phase 2 runtime (192× compression) - RECOMMENDED
        /// </summary>
        public static TOERuntimeLoader Phase2 => _phase2.Value;

        /// <summary>
        /// Get Phase 3 runtime (614× compression)
        /// </summary>
        public static TOERuntimeLoader Phase3 => _phase3.Value;

        /// <summary>
        /// Private constructor - use Phase1/Phase2/Phase3 properties
        /// </summary>
        private TOERuntimeLoader(int phase)
        {
            _phase = phase;
            _encryptionKey = "THOMAS_HANSEN_AINIRO_2025_SECRET_KEY"; // TODO: Load from config

            // Find and load .toe file
            string toePath = FindToeFile(phase);

            #if LINUX || UNITY_STANDALONE_LINUX || OSX || UNITY_STANDALONE_OSX
            _phaseHandle = toe_load_phase(toePath, _encryptionKey, phase);
            #else
            _phaseHandle = toe_load_phase_dynamic(toePath, _encryptionKey, phase);
            #endif

            if (_phaseHandle == IntPtr.Zero)
            {
                throw new Exception($"Failed to load TOE Phase {phase} runtime from {toePath}\n" +
                    $"Platform: {CurrentPlatform}\n" +
                    "Please check:\n" +
                    "1. Binaries exist in correct platform directory\n" +
                    "2. Encryption key is correct\n" +
                    "3. File permissions allow execution");
            }
        }

        /// <summary>
        /// Find .toe file for given phase
        /// </summary>
        private static string FindToeFile(int phase)
        {
            string assemblyDir = Path.GetDirectoryName(typeof(TOERuntimeLoader).Assembly.Location);
            string ext = GetLibraryExtension();
            string toeFileName = $"phase{phase}{ext}.toe";

            // Try platform-specific directory first
            string platformDir = GetBinaryDirectory(Path.Combine(assemblyDir, "TOE", "binaries"));
            string path1 = Path.Combine(platformDir, toeFileName);
            if (File.Exists(path1)) return path1;

            // Try base binaries directory
            string path2 = Path.Combine(assemblyDir, "TOE", "binaries", toeFileName);
            if (File.Exists(path2)) return path2;

            // Try current directory
            string path3 = Path.Combine(Directory.GetCurrentDirectory(), toeFileName);
            if (File.Exists(path3)) return path3;

            throw new FileNotFoundException(
                $"TOE Phase {phase} binary not found\n" +
                $"Platform: {CurrentPlatform}\n" +
                $"Expected file: {toeFileName}\n" +
                $"Searched paths:\n" +
                $"  1. {path1}\n" +
                $"  2. {path2}\n" +
                $"  3. {path3}\n\n" +
                "Please ensure the correct platform binaries are deployed.");
        }

        /// <summary>
        /// Compress a vector using this phase
        /// </summary>
        public byte[] Compress(float[] vector)
        {
            if (_disposed)
                throw new ObjectDisposedException(nameof(TOERuntimeLoader));

            // Allocate output buffer (generous size)
            byte[] compressed = new byte[vector.Length * 4]; // Worst case: no compression

            #if LINUX || UNITY_STANDALONE_LINUX || OSX || UNITY_STANDALONE_OSX
            int compressedSize = toe_compress_vector(_phaseHandle, vector, vector.Length, compressed, compressed.Length);
            #else
            int compressedSize = toe_compress_vector_dynamic(_phaseHandle, vector, vector.Length, compressed, compressed.Length);
            #endif

            if (compressedSize < 0)
            {
                throw new Exception($"TOE Phase {_phase} compression failed (error code: {compressedSize})");
            }

            // Trim to actual size
            byte[] result = new byte[compressedSize];
            Array.Copy(compressed, result, compressedSize);
            return result;
        }

        /// <summary>
        /// Compute distance between two compressed vectors
        /// </summary>
        public double Distance(byte[] compressedA, byte[] compressedB)
        {
            if (_disposed)
                throw new ObjectDisposedException(nameof(TOERuntimeLoader));

            #if LINUX || UNITY_STANDALONE_LINUX || OSX || UNITY_STANDALONE_OSX
            return toe_distance(_phaseHandle, compressedA, compressedA.Length, compressedB, compressedB.Length);
            #else
            return toe_distance_dynamic(_phaseHandle, compressedA, compressedA.Length, compressedB, compressedB.Length);
            #endif
        }

        /// <summary>
        /// Get current platform information (for debugging)
        /// </summary>
        public static string GetPlatformInfo()
        {
            return $"Platform: {CurrentPlatform}\n" +
                   $"Runtime: {RuntimeInformation.FrameworkDescription}\n" +
                   $"Architecture: {RuntimeInformation.OSArchitecture}\n" +
                   $"Library Extension: {GetLibraryExtension()}\n" +
                   $"Runtime Library: {GetRuntimeLibrary()}";
        }

        #endregion

        #region IDisposable

        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }

        protected virtual void Dispose(bool disposing)
        {
            if (_disposed)
                return;

            if (_phaseHandle != IntPtr.Zero)
            {
                #if LINUX || UNITY_STANDALONE_LINUX || OSX || UNITY_STANDALONE_OSX
                toe_unload_phase(_phaseHandle);
                #else
                toe_unload_phase_dynamic(_phaseHandle);
                #endif
                _phaseHandle = IntPtr.Zero;
            }

            _disposed = true;
        }

        ~TOERuntimeLoader()
        {
            Dispose(false);
        }

        #endregion
    }
}
