/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Threading.Tasks;
using MimeKit;
using MailKit;
using SM = MailKit.Net.Smtp;
using magic.lambda.mail.contracts;

namespace magic.lambda.mail.services
{
    /// <inheritdoc/>
    public sealed class SmtpClient : MailClient, ISmtpClient, IDisposable
    {
        readonly Lazy<SM.SmtpClient> _client = new Lazy<SM.SmtpClient>(() => new SM.SmtpClient());

        /// <inheritdic/>
        public override IMailService Client => _client.Value;

        /// <inheritdoc/>
        public void Send(MimeMessage message)
        {
            _client.Value.Send(message);
        }

        /// <inheritdoc/>
        public async Task SendAsync(MimeMessage message)
        {
            await _client.Value.SendAsync(message);
        }

        /// <inheritdoc/>
        public void Dispose()
        {
            if (_client.IsValueCreated)
                Client.Dispose();
        }
    }
}
