/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

namespace magic.node.contracts
{
    /// <summary>
    /// A cheap fingerprint of a file, changing whenever the file is changed. Both the time of the last write and the
    /// size are compared, such that two edits made within the resolution of the file system's clock are still told apart.
    /// </summary>
    /// <param name="LastWriteTicks">Time of last write, in UTC ticks</param>
    /// <param name="Length">Size of file in bytes</param>
    public readonly record struct FileStamp(long LastWriteTicks, long Length);

    /// <summary>
    /// Optional companion to <see cref="IFileService"/>, implemented by file services that can tell whether a file has
    /// changed without reading it. Callers that want to cache something derived from a file's content must fall back to
    /// not caching if their file service does not implement this interface.
    /// </summary>
    public interface IFileStamps
    {
        /// <summary>
        /// Returns the fingerprint of the specified file, or null if the file does not exist.
        /// </summary>
        /// <param name="path">Full path of the file</param>
        /// <returns>Fingerprint of the file, or null if it does not exist</returns>
        FileStamp? GetStamp(string path);
    }
}
