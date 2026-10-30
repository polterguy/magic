/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Threading.Tasks;
using System.Collections.Generic;

namespace magic.lambda.logging.contracts
{
    /// <summary>
    /// Interface to query log entries.
    /// </summary>
    public interface ILogQuery
    {
        /// <summary>
        /// Returns all log items matching specified arguments.
        /// </summary>
        /// <param name="max">Maximum number of items to return.</param>
        /// <param name="fromId">Offset of item where to start fetching items.</param>
        /// <param name="content">Optional value content must match to be returned.</param>
        /// <returns>Log items matching specified filter conditions.</returns>
        Task<IEnumerable<LogItem>> QueryAsync(int max, object fromId, string content = null);

        /// <summary>
        /// Returns total number of log items.
        /// </summary>
        /// <param name="content">Optional value content must match to be counted.</param>
        /// <returns>Number of items matching criteria.</returns>
        Task<long> CountAsync(string content = null);

        /// <summary>
        /// Returns log items matching the specified filtering condition grouped by dates for the last two weeks.
        /// </summary>
        /// <returns>Type and count.</returns>
        Task<IEnumerable<(string When, long Count)>> Timeshift(string content);

        /// <summary>
        /// Returns the log item with the specified ID.
        /// </summary>
        /// <param name="id">ID of item to return</param>
        /// <returns>Item with specified ID.</returns>
        Task<LogItem> Get(object id);

        /// <summary>
        /// Returns the capabilities of the log implementation.
        /// </summary>
        /// <returns>Capabilities for currently used log implementation.</returns>
        Capabilities Capabilities();
    }
}
