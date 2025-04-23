/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Threading.Tasks;
using MimeKit;
using MailKit;
using MP = MailKit.Net.Pop3;
using magic.lambda.mail.contracts;

namespace magic.lambda.mail.services
{
    /// <inheritdoc/>
    public sealed class Pop3Client : MailClient, IPop3Client, IDisposable
    {
        readonly Lazy<MP.Pop3Client> _client = new Lazy<MP.Pop3Client>(() => new MP.Pop3Client());

        /// <inheritdic/>
        public override IMailService Client => _client.Value;

        /// <inheritdoc/>
        public MimeMessage GetMessage(int index)
        {
            return _client.Value.GetMessage(index);
        }

        /// <inheritdoc/>
        public async Task<MimeMessage> GetMessageAsync(int index)
        {
            return await _client.Value.GetMessageAsync(index);
        }

        /// <inheritdoc/>
        public int GetMessageCount()
        {
            return _client.Value.GetMessageCount();
        }

        /// <inheritdoc/>
        public async Task<int> GetMessageCountAsync()
        {
            return await _client.Value.GetMessageCountAsync();
        }

        /// <inheritdoc/>
        public void Dispose()
        {
            if (_client.IsValueCreated)
                Client.Dispose();
        }
    }
}
