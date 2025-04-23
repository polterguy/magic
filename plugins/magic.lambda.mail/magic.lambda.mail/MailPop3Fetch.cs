/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
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
    /// Fetches all new messages from the specified POP3 server/account.
    /// </summary>
    [Slot(Name = "mail.pop3.fetch")]
    public class MailPop3Fetch : ISlotAsync
    {
        readonly ConnectionSettingsPop3 _server;
        readonly contracts.IPop3Client _client;
        readonly Func<int, int, int, bool> Done = (idx, count, max) => idx < count && (max == -1 || idx < max);

        /// <summary>
        /// Constructor for your class.
        /// </summary>
        /// <param name="server">Connection settings for connecting to POP3 server.</param>
        /// <param name="client">POP3 client implementation</param>
        public MailPop3Fetch(ConnectionSettingsPop3 server, contracts.IPop3Client client)
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
            // Retrieving arguments.
            var lambdaOriginal = input.Children.FirstOrDefault(x => x.Name == ".lambda") ??
                throw new HyperlambdaException("No [.lambda] object supplied to [mail.pop3.fetch]");
            var raw = input.Children.FirstOrDefault(x => x.Name == "raw")?.GetEx<bool>() ?? false;
            var max = input.Children.FirstOrDefault(x => x.Name == "max")?.GetEx<int>() ?? 50;

            // Connecting to POP3 server.
            await Utilities.Connect(input, _client, _server);
            try
            {
                // Authenticating if we're supposed to authenticate.
                await Utilities.Authenticate(input, _client, _server);

                // Retrieving message count from server.
                var count = await _client.GetMessageCountAsync();

                // Retrieving unread messages for as long as we're supposed to.
                for (var idx = 0; Done(idx, count, max); idx++)
                {
                    var lambda = lambdaOriginal.Clone();
                    var message = await _client.GetMessageAsync(idx);
                    HandleMessage(
                        message,
                        signaler,
                        lambda,
                        raw);
                    await signaler.SignalAsync("eval", lambda);
                }
            }
            finally
            {
                await _client.DisconnectAsync(true);
            }
        }

        #region [ -- Private methods and classes -- ]

        /*
         * Helper method to handle one single message, by parsing it (unless raw is true), and invoking [.lambda]
         * callback to notify client of message retrieved.
         */
        void HandleMessage(
            MimeMessage message,
            ISignaler signaler,
            Node lambda,
            bool raw)
        {
            using (var body = message.Body)
            {
                var messageNode = new Node(".message");
                lambda.Insert(0, messageNode);

                if (raw)
                {
                    messageNode.Value = message.ToString();
                }
                else
                {
                    messageNode.Add(new Node("subject", message.Subject));
                    AddRecipient(message.From.Select(x => x as MailboxAddress), messageNode, "from");
                    AddRecipient(message.To.Select(x => x as MailboxAddress), messageNode, "to");
                    AddRecipient(message.Cc.Select(x => x as MailboxAddress), messageNode, "cc");
                    AddRecipient(message.Bcc.Select(x => x as MailboxAddress), messageNode, "bcc");

                    var parseNode = new Node("", body);
                    signaler.Signal(".mime.parse", parseNode);
                    var entity = new Node("entity", parseNode.Value);
                    entity.AddRange(parseNode.Children);
                    messageNode.Add(entity);
                }
            }
        }

        /*
         * Helper method to handle a specific type of recipient, and creating a lambda list of nodes,
         * wrapping recipient's email address.
         */
        void AddRecipient(IEnumerable<MailboxAddress> items, Node node, string nodeName)
        {
            if (items == null || !items.Any())
                return;
            var collectionNode = new Node(nodeName);
            foreach (var idx in items)
            {
                if (idx == null)
                    continue; // Might be other types of addresses in theory ...
                collectionNode.Add(new Node(idx.Name, idx.Address));
            }
            node.Add(collectionNode);
        }

        #endregion
    }
}
