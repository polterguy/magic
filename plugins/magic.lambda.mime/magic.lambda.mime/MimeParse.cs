/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.IO;
using System.Text;
using MimeKit;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.mime
{
    /// <summary>
    /// Parses a MIME message and returns its as a hierarchical object of lambda to caller.
    /// </summary>
    [Slot(
        Name = "mime.parse",
        Description = "Parses a raw MIME message into a lambda tree of headers and body parts; commonly used for email or multipart payloads",
        ValueKind = "mime-message",
        ValueDescription = "Raw MIME message to parse",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.Both,
        ReturnsKind = "content-type,text",
        ReturnsElementKind = "mime-tree-node",
        ReturnsDescription = "Resolves to the parsed MIME entity content type as the node value, and headers, content, and nested entities as child nodes",
        SignatureType = typeof(global::magic.lambda.mime.signatures.MimeParseSignature))]
    public class MimeParse : ISlot
    {
        /// <summary>
        /// Implementation of your slot.
        /// </summary>
        /// <param name="signaler">Signaler that raised the signal.</param>
        /// <param name="input">Arguments to your slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            using (var stream = new MemoryStream(Encoding.UTF8.GetBytes(input.GetEx<string>())))
            {
                using (var entity = MimeEntity.Load(stream))
                {
                    helpers.MimeParser.Parse(input, entity);
                }
            }
        }
    }
}
