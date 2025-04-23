/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Threading.Tasks;
using MimeKit;

namespace magic.lambda.mail.contracts
{
    /// <summary>
    /// Abstract POP3 interface dependency injected into POP3 fetcher class.
    /// </summary>
    public interface IPop3Client : IMailClient
    {
        /// <summary>
        /// Returns number of new messages on POP3 client.
        /// </summary>
        /// <returns>Number of messages available to fetch</returns>
        int GetMessageCount();

        /// <summary>
        /// Returns number of new messages on POP3 client.
        /// </summary>
        /// <returns>Awaitable task with number of new messages as its result</returns>
        Task<int> GetMessageCountAsync();

        /// <summary>
        /// Returns specified message from POP3 queue.
        /// </summary>
        /// <param name="index">What message to retrieve</param>
        /// <returns>Specified message</returns>
        MimeMessage GetMessage(int index);

        /// <summary>
        /// Returns specified message from POP3 queue.
        /// </summary>
        /// <param name="index">What message to retrieve</param>
        /// <returns>Awaitable task with specified message</returns>
        Task<MimeMessage> GetMessageAsync(int index);
    }
}
