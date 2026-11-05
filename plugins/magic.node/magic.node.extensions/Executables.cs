/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System;
using System.IO;

namespace magic.node.extensions
{
    /// <summary>
    /// Locates the executables the server starts as processes, such as git and python.
    /// 
    /// A process started by bare name is searched for by the operating system, in places that can include the
    /// current directory, so executables are resolved to an absolute path before they are started.
    /// </summary>
    public static class Executables
    {
        static readonly string[] _windowsSuffixes = [".exe", ".cmd", ".bat"];
        static readonly string[] _noSuffix = [""];

        /// <summary>
        /// Returns the absolute path of the specified executable, found in the folders of the PATH environment
        /// variable, or null if there is no such executable.
        /// 
        /// Relative folders in the PATH are ignored, since they depend on the current directory.
        /// </summary>
        /// <param name="name">Name of the executable, such as 'git'. An absolute path is returned as it is, if the file exists.</param>
        /// <returns>The absolute path of the executable, or null.</returns>
        public static string Find(string name)
        {
            if (Path.IsPathRooted(name))
                return File.Exists(name) ? name : null;

            var suffixes = OperatingSystem.IsWindows() ? _windowsSuffixes : _noSuffix;
            var folders = (Environment.GetEnvironmentVariable("PATH") ?? "").Split(Path.PathSeparator, StringSplitOptions.RemoveEmptyEntries);
            foreach (var folder in folders)
            {
                if (!Path.IsPathRooted(folder))
                    continue;

                foreach (var suffix in suffixes)
                {
                    var candidate = Path.Combine(folder, name + suffix);
                    if (File.Exists(candidate))
                        return candidate;
                }
            }
            return null;
        }
    }
}
