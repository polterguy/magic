/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

namespace magic.data.common.contracts
{
    /// <summary>
    /// Helper class to encapsulate settings for databases.
    /// </summary>
    public interface IDataSettings
    {
        /// <summary>
        /// Returns the default database type the current installation is using.
        /// </summary>
        /// <value>Default database type.</value>
        string DefaultDatabaseType { get; }

        /// <summary>
        /// Returns the specified connection string.
        /// </summary>
        /// <param name="name">Name of connection string to return.</param>
        /// <param name="databaseType">Database type to return connection string for. If null default database type will be used.</param>
        /// <returns>Connection string.</returns>
        string ConnectionString(string name, string databaseType = null);
    }
}
