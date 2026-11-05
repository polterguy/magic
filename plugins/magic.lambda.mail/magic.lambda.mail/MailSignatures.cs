/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Collections.Generic;
using magic.signals.contracts;
using MimeSig = magic.lambda.mime.signatures.MimeCreateSignature;

namespace magic.lambda.mail.signatures
{
    /// <summary>
    /// Signature for [mail.smtp.send].
    /// </summary>
    public class MailSmtpSendSignature : ISlotSignature
    {
        /// <inheritdoc />
        public IEnumerable<SlotChild> Children => new[]
        {
            Message(),
        };

        static SlotChild Message()
        {
            return new SlotChild
            {
                Name = "message",
                Type = "lambda",
                Kind = "mail-message",
                Description = "Email message to send",
                Required = true,
                Mode = SlotChildMode.StructuredArguments,
                Cardinality = SlotChildCardinality.OneOrMore,
                Role = SlotChildRole.StructuredObject,
                Projection = SlotChildProjection.StructuredTree,
                Children =
                {
                    Option("subject", "string", "Message subject", false, "mail-subject,text"),
                    Addresses("to", true),
                    Addresses("from", false),
                    Addresses("cc", false),
                    Addresses("bcc", false),
                    Addresses("reply-to", false),
                    Entity(),
                },
            };
        }

        static internal SlotChild Option(string name, string type, string description, bool required, string kind = null)
        {
            return new SlotChild
            {
                Name = name,
                Type = type,
                Kind = kind,
                Description = description,
                Required = required,
                Mode = SlotChildMode.ValueOrExpression,
                Cardinality = required ? SlotChildCardinality.ExactlyOne : SlotChildCardinality.ZeroOrOne,
                Role = SlotChildRole.Option,
                Projection = SlotChildProjection.Value,
            };
        }

        static SlotChild Addresses(string name, bool required)
        {
            return new SlotChild
            {
                Name = name,
                Type = "lambda",
                Kind = "mail-address-list",
                Description = "Email address collection",
                Required = required,
                Mode = SlotChildMode.StructuredArguments,
                Cardinality = required ? SlotChildCardinality.ExactlyOne : SlotChildCardinality.ZeroOrOne,
                Role = SlotChildRole.StructuredObject,
                Projection = SlotChildProjection.Children,
                Children =
                {
                    new SlotChild
                    {
                        Name = ".",
                        Type = "lambda",
                        Kind = "mail-address",
                        Description = "Structured address containing [email] and optional [name]",
                        Required = required,
                        Mode = SlotChildMode.StructuredArguments,
                        Cardinality = required ? SlotChildCardinality.OneOrMore : SlotChildCardinality.ZeroOrMore,
                        Role = SlotChildRole.StructuredObject,
                        Projection = SlotChildProjection.StructuredTree,
                        Children =
                        {
                            Option("name", "string", "Display name", false, "display-name,text"),
                            Option("email", "string", "Email address", true, "email"),
                        },
                    },
                },
            };
        }

        // The message body's [entity] is consumed by the runtime via [.mime.create], so it must
        // mirror that slot's MIME entity shape exactly (content-type value plus leaf or multipart
        // children). Reuse the shared declaration so meta stays in sync — every constraint, child
        // and kind hint from [mime.create] applies here too.
        static SlotChild Entity()
        {
            var entity = MimeSig.Entity();
            entity.Description = "MIME entity declaration for the message body; node value is the MIME content type";
            entity.Cardinality = SlotChildCardinality.ExactlyOne;
            entity.Role = SlotChildRole.Payload;
            entity.Evaluation = SlotChildEvaluation.UnwrapDescendants;
            return entity;
        }
    }

    /// <summary>
    /// Signature for [mail.pop3.fetch].
    /// </summary>
    public class MailPop3FetchSignature : ISlotSignature
    {
        public IEnumerable<SlotChild> Children => new[]
        {
            MailSmtpSendSignature.Option("raw", "bool", "Whether to pass raw MIME text to the callback", false),
            MailSmtpSendSignature.Option("max", "int", "Maximum number of messages to fetch", false),
            new SlotChild
            {
                Name = ".lambda",
                Type = "lambda",
                Description = "Callback evaluated once per fetched message with [.message] injected",
                Required = true,
                Mode = SlotChildMode.ExecutableLambda,
                Cardinality = SlotChildCardinality.ExactlyOne,
                Role = SlotChildRole.Callback,
                Evaluation = SlotChildEvaluation.EvalBlock,
                Projection = SlotChildProjection.Self,
            },
        };
    }
}
