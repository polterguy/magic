/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using MimeKit;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.mime
{
    /// <summary>
    /// Parses a MimeEntity message and returns its as a hierarchical object of lambda to caller.
    /// </summary>
    [Slot(
        Name = ".mime.parse",
        Description = "Parses a MIME message without exposing the public wrapper slot",
        ValueKind = "mime-entity",
        ValueDescription = "MIME entity to parse",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.Both,
        ReturnsKind = "mime-tree,lambda-tree",
        ReturnsElementKind = "mime-tree-node",
        ReturnsDescription = "Resolves to a MIME entity tree where the value is the entity content type and children contain headers, content, and nested entities",
        SignatureType = typeof(global::magic.lambda.mime.signatures.MimeParseSignature))]
    public class MimeParsePrivate : ISlot
    {
        /// <summary>
        /// Implementation of your slot.
        /// </summary>
        /// <param name="signaler">Signaler that raised the signal.</param>
        /// <param name="input">Arguments to your slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var message = input.Get<MimeEntity>();
            helpers.MimeParser.Parse(input, message);
        }
    }
}
