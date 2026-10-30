/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Collections.Generic;
using magic.signals.contracts;

namespace magic.lambda.json.signatures
{
    public class JsonStreamSignature : ISlotSignature
    {
        public IEnumerable<SlotChild> Children => new[]
        {
            Option("encoding", "string", "Text encoding used to read the JSON stream", "utf-8", "text-encoding"),
        };

        static SlotChild Option(string name, string type, string description, string defaultValue, string kind = null)
        {
            return new SlotChild
            {
                Name = name,
                Type = type,
                Kind = kind,
                Description = description,
                Required = false,
                DefaultValue = defaultValue,
                Mode = SlotChildMode.ValueOrExpression,
                Cardinality = SlotChildCardinality.ZeroOrOne,
                Role = SlotChildRole.Option,
                Projection = SlotChildProjection.Value,
            };
        }
    }

    public class Lambda2JsonSignature : ISlotSignature
    {
        public IEnumerable<SlotChild> Children => new[]
        {
            new SlotChild
            {
                Name = "format",
                Type = "bool",
                Description = "Whether to pretty-print the JSON output",
                Required = false,
                DefaultValue = "false",
                Mode = SlotChildMode.ValueOrExpression,
                Cardinality = SlotChildCardinality.ZeroOrOne,
                Role = SlotChildRole.Option,
                Projection = SlotChildProjection.Value,
            },
        };

        internal static SlotChild RootNode(string description)
        {
            return new SlotChild
            {
                Name = "*",
                Type = "lambda",
                Description = description,
                Required = false,
                Mode = SlotChildMode.ValueOrExpression,
                Cardinality = SlotChildCardinality.ZeroOrMore,
                Role = SlotChildRole.StructuredObject,
                Projection = SlotChildProjection.StructuredTree,
            };
        }
    }

    public class Lambda2YamlSignature : ISlotSignature
    {
        public IEnumerable<SlotChild> Children => System.Array.Empty<SlotChild>();
    }

    public class Lambda2JsonRawSignature : ISlotSignature
    {
        public IEnumerable<SlotChild> Children => new[]
        {
            Lambda2JsonSignature.RootNode("JSON property or array item node"),
        };
    }
}
