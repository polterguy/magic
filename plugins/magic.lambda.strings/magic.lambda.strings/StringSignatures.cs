/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Collections.Generic;
using magic.signals.contracts;

namespace magic.lambda.strings.signatures
{
    /// <summary>
    /// Child signatures for string slots.
    /// </summary>
    public abstract class StringSignature : ISlotSignature
    {
        /// <inheritdoc />
        public virtual IEnumerable<SlotChild> Children => System.Array.Empty<SlotChild>();

        /// <inheritdoc />
        public virtual IEnumerable<SlotConstraint> Constraints => System.Array.Empty<SlotConstraint>();

        protected static SlotChild Arg(
            string name,
            string type,
            string description,
            bool required = true,
            SlotChildCardinality cardinality = SlotChildCardinality.ExactlyOne,
            string kind = null)
        {
            return new SlotChild
            {
                Name = name,
                Type = type,
                Kind = kind ?? (type == "string" ? "text" : null),
                Description = description,
                Required = required,
                Mode = SlotChildMode.ExecutableLambda,
                Cardinality = cardinality,
                Role = SlotChildRole.SourceExpression,
                Evaluation = SlotChildEvaluation.EvalSelf,
                Projection = SlotChildProjection.Value,
            };
        }
    }

    /// <summary>
    /// Signature for replace slots taking a search value and replacement value.
    /// </summary>
    public class ReplaceSignature : StringSignature
    {
        /// <inheritdoc />
        public override IEnumerable<SlotChild> Children => new[]
        {
            Arg(".", "string", "Text or pattern to find"),
            Arg(".", "string", "Replacement text", false, SlotChildCardinality.ZeroOrOne),
        };
    }

    /// <summary>
    /// Signature for replace slots requiring exactly two arguments.
    /// </summary>
    public class ReplaceTwoArgsSignature : StringSignature
    {
        /// <inheritdoc />
        public override IEnumerable<SlotChild> Children => new[]
        {
            Arg(".", "string", "Text or pattern to find"),
            Arg(".", "string", "Replacement text"),
        };
    }

    /// <summary>
    /// Signature for [strings.replace-not-of] — first arg is the allow-list
    /// character set, second is the replacement string for non-matching chars.
    /// </summary>
    public class ReplaceNotOfSignature : StringSignature
    {
        /// <inheritdoc />
        public override IEnumerable<SlotChild> Children => new[]
        {
            Arg(".", "string", "Allowed characters; any character not in this set is replaced", kind: "character-set"),
            Arg(".", "string", "Replacement text for non-matching characters", kind: "character-replacement"),
        };
    }

    /// <summary>
    /// Signature for [strings.regex.replace] — first arg is a regex pattern,
    /// second is the replacement string.
    /// </summary>
    public class RegexReplaceSignature : StringSignature
    {
        /// <inheritdoc />
        public override IEnumerable<SlotChild> Children => new[]
        {
            Arg(".", "string", "Regular expression pattern to match", kind: "regex-pattern"),
            Arg(".", "string", "Replacement text", kind: "character-replacement"),
        };
    }

    /// <summary>
    /// Signature for [strings.substring].
    /// </summary>
    public class SubstringSignature : StringSignature
    {
        /// <inheritdoc />
        public override IEnumerable<SlotChild> Children => new[]
        {
            Arg(".", "int", "Start index", kind: "substring-arg"),
            Arg(".", "int", "Optional length", false, SlotChildCardinality.ZeroOrOne, "substring-arg"),
        };
    }

    /// <summary>
    /// Signature for [strings.split].
    /// </summary>
    public class SplitSignature : StringSignature
    {
        /// <inheritdoc />
        // Cardinality narrowed to ExactlyOne for the corpus. The runtime
        // accepts multiple separators (Split.cs collects every `[.]` child
        // and passes the array to String.Split), but emitting more than one
        // confuses the teaching signal — readers see `strings.split` with a
        // primary separator and a second incidental token without an
        // obvious reason. ExactlyOne keeps the generated examples to the
        // common, idiomatic shape. Authors who legitimately need multiple
        // separators can still write them by hand against the unchanged
        // runtime.
        public override IEnumerable<SlotChild> Children => new[]
        {
            Arg(".", "string", "Separator to split on", true, SlotChildCardinality.ExactlyOne, "string-separator"),
        };
    }

    /// <summary>
    /// Signature for [strings.join].
    /// </summary>
    public class JoinSignature : StringSignature
    {
        /// <inheritdoc />
        public override IEnumerable<SlotChild> Children => new[]
        {
            Arg(".", "string", "Separator to place between joined values", false, SlotChildCardinality.ZeroOrOne, "string-separator"),
        };
    }

    /// <summary>
    /// Signature for string predicates taking a single evaluated argument.
    /// </summary>
    public class SingleStringArgumentSignature : StringSignature
    {
        /// <inheritdoc />
        public override IEnumerable<SlotChild> Children => new[]
        {
            Arg(".", "string", "String argument"),
        };
    }

    /// <summary>
    /// Signature for regex slots taking a regular-expression pattern argument.
    /// </summary>
    public class RegexStringArgumentSignature : StringSignature
    {
        /// <inheritdoc />
        public override IEnumerable<SlotChild> Children => new[]
        {
            Arg(".", "string", "Regular expression pattern to match against the source string", kind: "regex-pattern"),
        };
    }

    /// <summary>
    /// Signature for string slots taking an optional character set argument.
    /// </summary>
    public class OptionalStringArgumentSignature : StringSignature
    {
        /// <inheritdoc />
        public override IEnumerable<SlotChild> Children => new[]
        {
            Arg(".", "string", "Optional string argument", false, SlotChildCardinality.ZeroOrOne),
        };
    }

    /// <summary>
    /// Signature for trim slots taking an optional character set argument.
    /// </summary>
    public class TrimSignature : StringSignature
    {
        /// <inheritdoc />
        public override IEnumerable<SlotChild> Children => new[]
        {
            Arg(".", "string", "Optional characters to trim", false, SlotChildCardinality.ZeroOrOne, "trim-characters"),
        };
    }

    /// <summary>
    /// Signature for [strings.concat].
    /// </summary>
    public class ConcatSignature : StringSignature
    {
        /// <inheritdoc />
        public override IEnumerable<SlotChild> Children => new[]
        {
            Arg(".", "string", "Text segment to concatenate", false, SlotChildCardinality.ZeroOrMore),
        };

        /// <inheritdoc />
        public override IEnumerable<SlotConstraint> Constraints => new[]
        {
            new SlotConstraint
            {
                Kind = SlotConstraintKind.ExactlyOneOf,
                Description = "Provide either expression input or child text segments",
                Values = { "input", "." },
            },
        };
    }

    /// <summary>
    /// Signature for [strings.mixin].
    /// </summary>
    public class StringMixinSignature : StringSignature
    {
        /// <inheritdoc />
        public override IEnumerable<SlotChild> Children => new[]
        {
            new SlotChild
            {
                Name = "strip",
                Type = "bool",
                Description = "Whether to strip embedded Hyperlambda instead of executing it",
                Required = false,
                DefaultValue = "false",
                Mode = SlotChildMode.ValueOrExpression,
                Cardinality = SlotChildCardinality.ZeroOrOne,
                Role = SlotChildRole.Option,
                Projection = SlotChildProjection.Value,
            },
            new SlotChild
            {
                Name = "*",
                Type = "string",
                Kind = "string-values",
                Description = "Argument passed to embedded Hyperlambda snippets invoked from the template",
                Required = false,
                Mode = SlotChildMode.ValueOrExpression,
                Cardinality = SlotChildCardinality.ZeroOrMore,
                Role = SlotChildRole.Arguments,
                Projection = SlotChildProjection.ArgumentBag,
                // The arg child names are NOT independent — they must match
                // the `{{*/token}}` placeholders inside the parent slot's
                // mixin-template Input value. Mark the link and the token
                // pattern so the synth derives child names from the parsed
                // template instead of inventing random ones. Same mechanism
                // [http.get]'s [url-params] uses against url-template inputs;
                // here the wildcard child IS the linked schema (no wrapper)
                // because mixin args are direct children of the slot.
                LinkedToValueKind = "mixin-template",
                LinkedTokenPattern = @"\{\{\*/([^}]+)\}\}",
            },
        };
    }

    /// <summary>
    /// Signature for [strings.builder].
    /// </summary>
    public class StringBuilderSignature : StringSignature
    {
        /// <inheritdoc />
        public override IEnumerable<SlotChild> Children => new[]
        {
            new SlotChild
            {
                Name = "*",
                Type = "lambda",
                Description = "Executable child slot evaluated while the StringBuilder is scoped; use [strings.builder.append] to append text",
                Required = false,
                Mode = SlotChildMode.ExecutableLambda,
                Cardinality = SlotChildCardinality.ZeroOrMore,
                Role = SlotChildRole.ExecutableBody,
                Evaluation = SlotChildEvaluation.EvalSelf,
                Projection = SlotChildProjection.Self,
            },
        };
    }
}
