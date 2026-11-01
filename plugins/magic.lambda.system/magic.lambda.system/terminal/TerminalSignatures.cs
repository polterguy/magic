/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Collections.Generic;
using magic.signals.contracts;

namespace magic.lambda.system.terminal.signatures
{
    /// <summary>
    /// Signature for [system.execute].
    /// </summary>
    public class TerminalExecuteSignature : ISlotSignature
    {
        /// <inheritdoc />
        public IEnumerable<SlotChild> Children => new[]
        {
            Args(),
            Option("working-directory", "string", "Working directory for the process", "folder-path"),
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

        static SlotChild Args()
        {
            return new SlotChild
            {
                Name = "args",
                Type = "string|lambda",
                Kind = "terminal-arguments",
                Description = "Process arguments as a shell-like string or child values",
                Required = false,
                Mode = SlotChildMode.StructuredArguments,
                Cardinality = SlotChildCardinality.ZeroOrOne,
                Role = SlotChildRole.Arguments,
                Projection = SlotChildProjection.ArgumentBag,
                Children =
                {
                    new SlotChild
                    {
                        Name = "*",
                        Type = "string",
                        Kind = "terminal-argument",
                        Description = "Single process argument",
                        Required = false,
                        Mode = SlotChildMode.ValueOrExpression,
                        Cardinality = SlotChildCardinality.ZeroOrMore,
                        Role = SlotChildRole.Arguments,
                        Projection = SlotChildProjection.Value,
                    },
                },
            };
        }
    }
}
