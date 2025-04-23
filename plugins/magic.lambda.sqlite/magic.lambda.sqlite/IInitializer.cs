/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using Aista.Data.Sqlite;

namespace magic.lambda.sqlite
{
    /// <summary>
    /// Interface for initializing database connection. Useful for loading plugins and such.
    /// </summary>
    public interface IInitializer
    {
        /// <summary>
        /// Initializes the database, invoked every single time you create a new database connection.
        /// </summary>
        /// <param name="connection">Recently created SQLite database connection</param>
        void Initialize(SqliteConnection connection);
    }
}
