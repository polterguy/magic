/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Collections.Generic;

namespace magic.node.contracts
{
    /// <summary>
    /// Interface wrapping configuration settings for Magic.
    /// </summary>
    public interface IMagicConfiguration
    {
        /// <summary>
        /// Returns the specified key as a string value.
        /// </summary>
        /// <value>The string representation value of the specified key.</value>
        string this [string key] { get; }

        /// <summary>
        /// Returns the specified section as a key/value pair.
        /// </summary>
        /// <param name="key">Key to return.</param>
        /// <returns>Key/value pair of sepcific configuration section.</returns>
        Dictionary<string, string> GetSection(string key);
    }
}
