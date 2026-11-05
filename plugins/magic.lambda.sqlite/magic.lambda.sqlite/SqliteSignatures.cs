/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Collections.Generic;
using magic.signals.contracts;

namespace magic.lambda.sqlite.signatures
{
    public class LoadExtensionSignature : ISlotSignature
    {
        public IEnumerable<SlotChild> Children => new[]
        {
            Option("file", "string", "SQLite extension filename", true, kind: "sqlite-extension-file"),
            Option("proc", "string", "Optional extension entry point", kind: "sqlite-entry-point"),
            Option("append-platform", "bool", "Whether to append the current platform suffix", false, "true"),
        };

        static SlotChild Option(string name, string type, string description, bool required = false, string defaultValue = null, string kind = null)
        {
            return new SlotChild
            {
                Name = name,
                Type = type,
                Kind = kind,
                Description = description,
                Required = required,
                DefaultValue = defaultValue,
                Mode = SlotChildMode.ValueOrExpression,
                Cardinality = required ? SlotChildCardinality.ExactlyOne : SlotChildCardinality.ZeroOrOne,
                Role = SlotChildRole.Option,
                Projection = SlotChildProjection.Value,
            };
        }
    }
}
