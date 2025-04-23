/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Threading.Tasks;
using System.Collections.Generic;

namespace magic.lambda.logging.contracts
{
    /// <summary>
    /// Log interface to log errors and events occurring in the system.
    /// </summary>
    public interface ILogger
    {
        /// <summary>
        /// Logs a debug entry.
        /// </summary>
        /// <param name="content">Entry to log.</param>
        /// <returns>Awaitable task.</returns>
        Task DebugAsync(string content);

        /// <summary>
        /// Logs a debug entry.
        /// </summary>
        /// <param name="content">Entry to log.</param>
        /// <param name="meta">Additional meta information associated with log entry.</param>
        /// <returns>Awaitable task.</returns>
        Task DebugAsync(string content, Dictionary<string, string> meta);

        /// <summary>
        /// Logs an info entry.
        /// </summary>
        /// <param name="content">Entry to log.</param>
        /// <returns>Awaitable task.</returns>
        Task InfoAsync(string content);

        /// <summary>
        /// Logs an info entry.
        /// </summary>
        /// <param name="content">Entry to log.</param>
        /// <param name="meta">Additional meta information associated with log entry.</param>
        /// <returns>Awaitable task.</returns>
        Task InfoAsync(string content, Dictionary<string, string> meta);

        /// <summary>
        /// Logs an error, optionally associated with an exception.
        /// </summary>
        /// <param name="content">Entry to log.</param>
        /// <returns>Awaitable task.</returns>
        Task ErrorAsync(string content);

        /// <summary>
        /// Logs an error, optionally associated with an exception.
        /// </summary>
        /// <param name="content">Entry to log.</param>
        /// <param name="meta">Additional meta information associated with log entry.</param>
        /// <returns>Awaitable task.</returns>
        Task ErrorAsync(string content, Dictionary<string, string> meta);

        /// <summary>
        /// Logs an error, optionally associated with an exception.
        /// </summary>
        /// <param name="content">Entry to log.</param>
        /// <param name="stackTrace">Stack trace of exception.</param>
        /// <returns>Awaitable task.</returns>
        Task ErrorAsync(string content, string stackTrace);

        /// <summary>
        /// Logs an error, optionally associated with an exception.
        /// </summary>
        /// <param name="content">Entry to log.</param>
        /// <param name="meta">Additional meta information associated with log entry.</param>
        /// <param name="stackTrace">Stack trace of exception.</param>
        /// <returns>Awaitable task.</returns>
        Task ErrorAsync(string content, Dictionary<string, string> meta, string stackTrace);

        /// <summary>
        /// Logs a fatal error.
        /// </summary>
        /// <param name="content">Entry to log.</param>
        /// <returns>Awaitable task.</returns>
        Task FatalAsync(string content);

        /// <summary>
        /// Logs a fatal error.
        /// </summary>
        /// <param name="content">Entry to log.</param>
        /// <param name="meta">Additional meta information associated with log entry.</param>
        /// <returns>Awaitable task.</returns>
        Task FatalAsync(string content, Dictionary<string, string> meta);

        /// <summary>
        /// Logs a fatal error, optionally associated with an exception.
        /// </summary>
        /// <param name="content">Entry to log.</param>
        /// <param name="stackTrace">Stack trace of exception.</param>
        /// <returns>Awaitable task.</returns>
        Task FatalAsync(string content, string stackTrace);

        /// <summary>
        /// Logs a fatal error, optionally associated with an exception.
        /// </summary>
        /// <param name="content">Entry to log.</param>
        /// <param name="meta">Additional meta information associated with log entry.</param>
        /// <param name="stackTrace">Stack trace of exception.</param>
        /// <returns>Awaitable task.</returns>
        Task FatalAsync(string content, Dictionary<string, string> meta, string stackTrace);
    }
}
