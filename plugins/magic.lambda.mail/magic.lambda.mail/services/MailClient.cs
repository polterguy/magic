/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Threading.Tasks;
using MailKit;
using magic.lambda.mail.contracts;

namespace magic.lambda.mail.services
{
    /// <inheritdoc/>
    public abstract class MailClient : IMailClient
    {
        /// <inheritdoc/>
        public void Authenticate(string username, string password)
        {
            Client.Authenticate(username, password);
        }

        /// <inheritdoc/>
        public async Task AuthenticateAsync(string username, string password)
        {
            await Client.AuthenticateAsync(username, password);
        }

        /// <inheritdoc/>
        public void Connect(string host, int port, bool useSsl)
        {
            Client.Connect(host, port, useSsl);
        }

        /// <inheritdoc/>
        public async Task ConnectAsync(string host, int port, bool useSsl)
        {
            await Client.ConnectAsync(host, port, useSsl);
        }

        /// <inheritdoc/>
        public void Disconnect(bool quit)
        {
            Client.Disconnect(quit);
        }

        /// <inheritdoc/>
        public async Task DisconnectAsync(bool quit)
        {
            await Client.DisconnectAsync(quit);
        }

        /// <summary>
        /// Returns the underlaying mail client to caller.
        /// </summary>
        /// <value>Actual mail client.</value>
        public abstract IMailService Client { get; }
    }
}
