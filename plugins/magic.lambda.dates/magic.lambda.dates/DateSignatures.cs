/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Collections.Generic;
using magic.signals.contracts;

namespace magic.lambda.dates.signatures
{
    public abstract class DateSignature : ISlotSignature
    {
        public virtual IEnumerable<SlotChild> Children => System.Array.Empty<SlotChild>();

        protected static SlotChild Option(string name, string type, string description, bool required = false, string defaultValue = null, string kind = null)
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

    public class DateFormatSignature : DateSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("format", "string", "Format string", true, kind: "date-format"),
        };
    }

    public class TimeSignature : DateSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("days", "int", "Number of days", defaultValue: "0"),
            Option("hours", "int", "Number of hours", defaultValue: "0"),
            Option("minutes", "int", "Number of minutes", defaultValue: "0"),
            Option("seconds", "int", "Number of seconds", defaultValue: "0"),
            Option("milliseconds", "int", "Number of milliseconds", defaultValue: "0"),
        };

        public IEnumerable<SlotConstraint> Constraints
        {
            get
            {
                var c = new SlotConstraint
                {
                    Kind = SlotConstraintKind.AtLeastOneOf,
                    Description = "[time] requires at least one component (days/hours/minutes/seconds/milliseconds)",
                };
                c.Values.AddRange(["days", "hours", "minutes", "seconds", "milliseconds"]);
                return new[] { c };
            }
        }
    }
}
