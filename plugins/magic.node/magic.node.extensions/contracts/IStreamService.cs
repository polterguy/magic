/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.IO;
using System.Threading.Tasks;

namespace magic.node.contracts
{
    /// <summary>
    /// Contract for handling streams in Magic.
    /// </summary>
    public interface IStreamService
    {
        /// <summary>
        /// Returns a stream wrapping the specified filename async.
        /// </summary>
        /// <param name="path">Absolute path to file.</param>
        /// <returns>Open Stream object.</returns>
        Task<Stream> OpenFileAsync(string path);

        /// <summary>
        /// Saves the specified stream to the specified filename async.
        /// </summary>
        /// <param name="stream">Stream wrapping content to save.</param>
        /// <param name="path">Absolute path to filename to save stream's content to.</param>
        /// <param name="overwrite">If true will overwrite existing file at specified path.</param>
        /// <returns>Awaitable task.</returns>
        Task SaveFileAsync(Stream stream, string path, bool overwrite);
    }
}
