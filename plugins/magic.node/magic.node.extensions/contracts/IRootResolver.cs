/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

namespace magic.node.contracts
{
    /// <summary>
    /// Contract for resolving root folder/namespace on disc for all IO operations.
    /// </summary>
    public interface IRootResolver
    {
        /// <summary>
        /// Returns the root folder or root namespace for all dynamic files, implying Hyperlambda files, endpoint files,
        /// and other files persisted into the Magic backend somehow.
        /// 
        /// Typically this is the root folder for all your dynamic files, the default being "~/files/"
        /// </summary>
        string DynamicFiles { get; }

        /// <summary>
        /// Returns the root folder or root namespace for all IO operations in Magic.
        /// 
        /// Typically this is the root folder where your backend.dll file physically exists on disc.
        /// </summary>
        string RootFolder { get; }

        /// <summary>
        /// Returns the relative path given the absolute path as an argument.
        /// 
        /// The relative path is a path where the DynamicFiles parts of it has been removed.
        /// </summary>
        /// <param name="path">Absolute path of file or folder.</param>
        /// <returns>Relative file or folder path.</returns>
        string RelativePath(string path);

        /// <summary>
        /// Returns the absolute path given the relative path as an argument.
        /// 
        /// The absolute path is a relative path with the DynamicFiles property prepended to it.
        /// </summary>
        /// <param name="path">Relative path of file or folder.</param>
        /// <returns>Absolute file or folder path.</returns>
        string AbsolutePath(string path);
    }
}
