/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using MimeKit;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.lambda.mail.helpers;
using magic.lambda.mail.contracts.settings;

namespace magic.lambda.mail
{
    /// <summary>
    /// Sends email messages through an SMTP server.
    /// </summary>
    [Slot(Name = "mail.smtp.send")]
    public class MailSmtpSend : ISlotAsync
    {
        readonly ConnectionSettingsSmtp _server;
        readonly contracts.ISmtpClient _client;

        /// <summary>
        /// Constructor for your SMTP slot class.
        /// </summary>
        /// <param name="server">Connection settings for connecting to SMTP server, in addition to default from part.</param>
        /// <param name="client">SMTP client implementation.</param>
        public MailSmtpSend(ConnectionSettingsSmtp server, contracts.ISmtpClient client)
        {
            _server = server;
            _client = client;
        }

        /// <summary>
        /// Implementation of your slot.
        /// </summary>
        /// <param name="signaler">Signaler that raised the signal.</param>
        /// <param name="input">Arguments to your slot.</param>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            // Connecting to SMTP server.
            await Utilities.Connect(input, _client, _server);
            try
            {
                // Authenticating if we're supposed to authenticate.
                await Utilities.Authenticate(input, _client, _server);

                // Iterating through each message and sending.
                foreach (var idxMsgNode in input.Children.Where(x => x.Name == "message"))
                {
                    // Creating MimeMessage, making sure we dispose any streams created in the process.
                    var message = await CreateMessageAsync(signaler, idxMsgNode);
                    using (message.Body)
                    {
                        // Sending message over existing SMTP connection.
                        await _client.SendAsync(message);
                    }
                }
            }
            finally
            {
                // Disconnecting and sending QUIT signal to SMTP server.
                await _client.DisconnectAsync(true);
            }
        }

        #region [ -- Private helpers -- ]

        /*
         * Creates a MimeMessage according to given node, and returns to caller.
         */
        async Task<MimeMessage> CreateMessageAsync(ISignaler signaler, Node node)
        {
            // Creating message.
            var message = new MimeMessage
            {
                // Decorating MimeMessage with subject.
                Subject = node.Children
                    .FirstOrDefault(x => x.Name == "subject")?
                    .GetEx<string>() ??
                    "" // Defaulting to empty string as subject.
            };

            // Decorating MimeMessage with to, and sanity checking invocation.
            message.To.AddRange(GetAddresses(node.Children.FirstOrDefault(x => x.Name == "to")));
            if (message.To.Count == 0)
                throw new HyperlambdaException("No [to] recipient found in [message]");

            // Adding [from] address, defaulting to configuration settings if not specified.
            var from = GetAddresses(node.Children.FirstOrDefault(x => x.Name == "from"));
            if (from.Any())
                message.From.AddRange(from);
            else
                message.From.Add(new MailboxAddress(_server.From.Name, _server.From.Address));

            // Adding CC, BCC and Reply-To if specified.
            message.Cc.AddRange(
                GetAddresses(
                    node.Children.FirstOrDefault(x => x.Name == "cc")));
            message.Bcc.AddRange(
                GetAddresses(
                    node.Children.FirstOrDefault(x => x.Name == "bcc")));
            message.ReplyTo.AddRange(
                GetAddresses(
                    node.Children.FirstOrDefault(x => x.Name == "reply-to")));

            // Creating actual MimeEntity to send.
            var clone = node.Children.First(x => x.Name == "entity").Clone();
            await signaler.SignalAsync(".mime.create", clone);
            var entity = clone.Value as MimeEntity;
            message.Body = entity;

            // Returning message (and streams) to caller.
            return message;
        }

        /*
         * Returns a bunch of email addresses by iterating the children of the specified node,
         * and transforming each into a valid MailboxAddress.
         */
        static IEnumerable<MailboxAddress> GetAddresses(Node iterator)
        {
            // Checking if we've got something to yield at all.
            if (iterator == null)
                yield break;

            // Returning a new mailbox address for each node specified.
            foreach (var idx in iterator.Children)
            {
                if (idx.Name == ".")
                {
                    yield return new MailboxAddress(
                      idx.Children.First(x => x.Name == "name").GetEx<string>(),
                      idx.Children.First(x => x.Name == "email").GetEx<string>());
                }
                else
                {
                    yield return new MailboxAddress(idx.Name, idx.GetEx<string>());
                }
            }
        }

        #endregion
    }
}
