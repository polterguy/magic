/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Threading.Tasks;

namespace magic.lambda.mail.contracts
{
    /// <summary>
    /// Abstract POP3/SMTP interface dependency injected into relevant classes.
    /// </summary>
    public interface IMailClient
    {
        /// <summary>
        /// Connects to an SMTP or POP3 server
        /// </summary>
        /// <param name="host">URL or IP address of your server.</param>
        /// <param name="port">Port to use for connection.</param>
        /// <param name="useSsl">If true, will use SSL/TLS to connect.</param>
        void Connect(string host, int port, bool useSsl);

        /// <summary>
        /// Connects asynchronously to an SMTP or POP3 server
        /// </summary>
        /// <param name="host">URL or IP address of your server.</param>
        /// <param name="port">Port to use for connection.</param>
        /// <param name="useSsl">If true, will use SSL/TLS to connect.</param>
        /// <returns>Awaitable task</returns>
        Task ConnectAsync(string host, int port, bool useSsl);

        /// <summary>
        /// Authenticates you to an already connected SMTP or POP3 server.
        /// </summary>
        /// <param name="username">Username</param>
        /// <param name="password">Password</param>
        void Authenticate(string username, string password);

        /// <summary>
        /// Authenticates you to an already connected SMTP or POP3 server.
        /// </summary>
        /// <param name="username">Username</param>
        /// <param name="password">Password</param>
        /// <returns>Awaitable task</returns>
        Task AuthenticateAsync(string username, string password);

        /// <summary>
        /// Disconnects from an already connected SMTP or POP3 server.
        /// </summary>
        /// <param name="quit">Whether or not to send the QUIT signal.</param>
        void Disconnect(bool quit);

        /// <summary>
        /// Disconnects from an already connected SMTP or POP3 server.
        /// </summary>
        /// <param name="quit">Whether or not to send the QUIT signal.</param>
        /// <returns>Awaitable task</returns>
        Task DisconnectAsync(bool quit);
    }
}
