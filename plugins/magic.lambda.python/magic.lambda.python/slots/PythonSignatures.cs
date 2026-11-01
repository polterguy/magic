/*
 * Magic Cloud, copyright (c) 2026 Thomas Hansen.
 */

using System.Collections.Generic;
using magic.signals.contracts;

namespace magic.lambda.python.signatures
{
    /// <summary>
    /// Signature for [python.execute].
    /// </summary>
    public class PythonExecuteSignature : ISlotSignature
    {
        /// <inheritdoc />
        public IEnumerable<SlotChild> Children => new[]
        {
            Option("code", "string", "Inline Python code to execute", kind: "python-code"),
            Option("file", "string", "Python file to execute", kind: "python-file"),
            Args(),
            Option("stdin", "string", "Text written to standard input", kind: "stdin-text"),
            Option("working-directory", "string", "Working directory for the Python process", kind: "folder-path"),
            Option("timeout", "int", "Execution timeout in seconds", "30"),
        };

        /// <inheritdoc />
        public IEnumerable<SlotConstraint> Constraints
        {
            get
            {
                var result = new SlotConstraint
                {
                    Kind = SlotConstraintKind.ExactlyOneOf,
                    Description = "Exactly one code source must be supplied",
                };
                result.Values.AddRange(new[] { "code", "file" });
                return new[] { result };
            }
        }

        static SlotChild Option(string name, string type, string description, string defaultValue = null, string kind = null)
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

        static SlotChild Args()
        {
            return new SlotChild
            {
                Name = "args",
                Type = "string|lambda",
                Kind = "terminal-arguments",
                Description = "Command-line arguments as a shell-like string or child values",
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
                        Description = "Single command-line argument",
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
