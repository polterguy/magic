/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Collections.Generic;
using magic.signals.contracts;

namespace magic.lambda.openai.signatures
{
    public class TokenizeSignature : ISlotSignature
    {
        public IEnumerable<SlotChild> Children => new[]
        {
            new SlotChild
            {
                Name = "model",
                Type = "string",
                Kind = "model-name",
                Description = "OpenAI model whose encoding to count with - defaults to o200k_base when omitted or unknown",
                Required = false,
                Mode = SlotChildMode.ValueOrExpression,
                Cardinality = SlotChildCardinality.ZeroOrOne,
                Role = SlotChildRole.Option,
                Projection = SlotChildProjection.Value,
            },
        };
    }

    public class WhisperSignature : ISlotSignature
    {
        public IEnumerable<SlotChild> Children => new[]
        {
            Option("key", "string", "OpenAI API key", true, "openai-api-key"),
            Option("content", "byte[]", "Audio content bytes", true, "binary-content"),
            Option("type", "string", "Audio MIME type", true, "content-type"),
            Option("language", "string", "Optional language hint", kind: "language-code"),
        };

        static SlotChild Option(string name, string type, string description, bool required = false, string kind = "")
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
    }
}
