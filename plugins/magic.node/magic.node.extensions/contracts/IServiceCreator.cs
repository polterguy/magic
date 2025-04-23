/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

namespace magic.node.contracts
{
    /// <summary>
    /// Common interface for creating services dynamically without having to resort to
    /// the service locator anti-pattern.
    /// </summary>
    public interface IServiceCreator<out T> where T : class
    {
        /// <summary>
        /// Creates a new service for you of the specified type.
        /// </summary>
        /// <returns>The newly created service.</returns>
        T Create();
    }
}
