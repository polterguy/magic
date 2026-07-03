/**
 * TOERuntimeLoader.cs - CORRECTED VERSION
 * C# P/Invoke Wrapper for TOE Runtime
 *
 * Matches actual toe_runtime.so function signatures
 *
 * For Thomas Hansen's Magic Platform
 * Francesco Pedulli, November 2, 2025
 */

using System;
using System.Runtime.InteropServices;

namespace magic.lambda.openai.TOE
{
    /// <summary>
    /// Runtime loader for TOE-encrypted binaries (.toe files)
    /// Handles loading, key verification, and function calls
    /// </summary>
    public class TOERuntimeLoader : IDisposable
    {
        private IntPtr _context = IntPtr.Zero;
        private bool _disposed = false;
        private string _toePath;

        // ═══════════════════════════════════════════════════════════════════════
        // P/INVOKE DECLARATIONS (matching actual toe_runtime.so exports)
        // ═══════════════════════════════════════════════════════════════════════

        [DllImport("toe_runtime.so", CallingConvention = CallingConvention.Cdecl)]
        private static extern IntPtr toe_runtime_load(
            [MarshalAs(UnmanagedType.LPStr)] string toe_path,
            [MarshalAs(UnmanagedType.LPStr)] string key);

        [DllImport("toe_runtime.so", CallingConvention = CallingConvention.Cdecl)]
        private static extern void toe_runtime_unload(IntPtr ctx);

        [DllImport("toe_runtime.so", CallingConvention = CallingConvention.Cdecl)]
        private static extern IntPtr toe_runtime_get_function(
            IntPtr ctx,
            [MarshalAs(UnmanagedType.LPStr)] string func_name);

        [DllImport("toe_runtime.so", CallingConvention = CallingConvention.Cdecl)]
        private static extern UIntPtr toe_runtime_compress_vector(
            IntPtr ctx,
            float[] vector,
            uint dim,
            byte[] out_buf,
            UIntPtr out_cap);

        [DllImport("toe_runtime.so", CallingConvention = CallingConvention.Cdecl)]
        private static extern double toe_runtime_distance(
            IntPtr ctx,
            byte[] blob_a,
            UIntPtr len_a,
            byte[] blob_b,
            UIntPtr len_b);

        // ═══════════════════════════════════════════════════════════════════════
        // CONSTRUCTOR & DISPOSAL
        // ═══════════════════════════════════════════════════════════════════════

        /// <summary>
        /// Load TOE-encrypted binary
        /// </summary>
        /// <param name="toePath">Path to .toe file (phase2.so.toe or phase3.so.toe)</param>
        /// <param name="key">Encryption key</param>
        public TOERuntimeLoader(string toePath, string key)
        {
            _toePath = toePath;

            _context = toe_runtime_load(toePath, key);

            if (_context == IntPtr.Zero)
            {
                throw new Exception($"Failed to load TOE binary: {toePath}. Check key and file integrity.");
            }
        }

        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }

        protected virtual void Dispose(bool disposing)
        {
            if (!_disposed)
            {
                if (_context != IntPtr.Zero)
                {
                    toe_runtime_unload(_context);
                    _context = IntPtr.Zero;
                }
                _disposed = true;
            }
        }

        ~TOERuntimeLoader()
        {
            Dispose(false);
        }

        // ═══════════════════════════════════════════════════════════════════════
        // PUBLIC API
        // ═══════════════════════════════════════════════════════════════════════

        /// <summary>
        /// Compress vector (returns size in bytes)
        /// </summary>
        /// <param name="vector">Input vector (float array)</param>
        /// <returns>Compressed blob (byte array)</returns>
        public byte[] Compress(float[] vector)
        {
            if (_context == IntPtr.Zero)
                throw new ObjectDisposedException("TOERuntimeLoader");

            // Allocate output buffer (max 1024 bytes should be enough)
            byte[] buffer = new byte[1024];

            UIntPtr size = toe_runtime_compress_vector(
                _context,
                vector,
                (uint)vector.Length,
                buffer,
                (UIntPtr)buffer.Length);

            if (size == UIntPtr.Zero)
                throw new Exception("TOE compression failed");

            // Return only the used portion
            byte[] result = new byte[(int)size];
            Array.Copy(buffer, result, (int)size);
            return result;
        }

        /// <summary>
        /// Compute distance between two compressed vectors
        /// </summary>
        public double Distance(byte[] compressed_a, byte[] compressed_b)
        {
            if (_context == IntPtr.Zero)
                throw new ObjectDisposedException("TOERuntimeLoader");

            return toe_runtime_distance(
                _context,
                compressed_a,
                (UIntPtr)compressed_a.Length,
                compressed_b,
                (UIntPtr)compressed_b.Length);
        }

        /// <summary>
        /// Check if runtime is loaded
        /// </summary>
        public bool IsLoaded => _context != IntPtr.Zero && !_disposed;
    }
}
