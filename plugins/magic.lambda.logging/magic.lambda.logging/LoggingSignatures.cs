/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Collections.Generic;
using magic.signals.contracts;

namespace magic.lambda.logging.signatures
{
    public class LogWriteSignature : ISlotSignature
    {
        public virtual IEnumerable<SlotChild> Children => new[]
        {
            Meta(),
        };

        protected static SlotChild Meta()
        {
            return new SlotChild
            {
                Name = "*",
                Type = "string",
                Kind = "log-metadata",
                Description = "Metadata entry stored with the log item when the slot has an input value; otherwise evaluated content fragment",
                Required = false,
                Mode = SlotChildMode.ValueOrExpression,
                Cardinality = SlotChildCardinality.ZeroOrMore,
                Role = SlotChildRole.DynamicMap,
                Evaluation = SlotChildEvaluation.EvalSelf,
                Projection = SlotChildProjection.Value,
            };
        }
    }

    public class LogErrorWriteSignature : LogWriteSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Meta(),
            Option("exception", "string", "Exception text attached to error and fatal log entries", "exception-text"),
        };

        static SlotChild Option(string name, string type, string description, string kind = null)
        {
            return new SlotChild
            {
                Name = name,
                Type = type,
                Kind = kind,
                Description = description,
                Required = false,
                Mode = SlotChildMode.ValueOrExpression,
                Cardinality = SlotChildCardinality.ZeroOrOne,
                Role = SlotChildRole.Option,
                Projection = SlotChildProjection.Value,
            };
        }
    }

    public class LogQuerySignature : ISlotSignature
    {
        public IEnumerable<SlotChild> Children => new[]
        {
            Option("max", "int", "Maximum number of log entries to return", "10"),
            Option("from", "object", "Cursor or timestamp to query from"),
        };

        static SlotChild Option(string name, string type, string description, string defaultValue = null)
        {
            return new SlotChild
            {
                Name = name,
                Type = type,
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
}
