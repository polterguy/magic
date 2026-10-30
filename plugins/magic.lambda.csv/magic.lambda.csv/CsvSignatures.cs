/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Collections.Generic;
using magic.signals.contracts;

namespace magic.lambda.csv.signatures
{
    public abstract class CsvSignature : ISlotSignature
    {
        public virtual IEnumerable<SlotChild> Children => System.Array.Empty<SlotChild>();

        // Virtual so [csv2lambda] can declare its row-list output without being
        // shadowed by ISlotSignature's default-interface-member.
        public virtual IEnumerable<SlotChild> OutputChildren => System.Array.Empty<SlotChild>();

        protected static SlotChild NullValue()
        {
            return new SlotChild
            {
                Name = "null-value",
                Type = "string",
                Kind = "null-value",
                Description = "String used to represent null values",
                Required = false,
                DefaultValue = "[NULL]",
                Mode = SlotChildMode.ValueOrExpression,
                Cardinality = SlotChildCardinality.ZeroOrOne,
                Role = SlotChildRole.Option,
                Projection = SlotChildProjection.Value,
            };
        }
    }

    public class Csv2LambdaSignature : CsvSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            new SlotChild
            {
                Name = "types",
                Type = "lambda",
                Kind = "csv-column-types",
                Description = "Column type conversions keyed by column name",
                Required = false,
                Mode = SlotChildMode.ValueOrExpression,
                Cardinality = SlotChildCardinality.ZeroOrOne,
                Role = SlotChildRole.DynamicMap,
                Projection = SlotChildProjection.StructuredTree,
                Children =
                {
                    new SlotChild
                    {
                        Name = "*",
                        Type = "string",
                        Kind = "csv-column-type",
                        Description = "Type name for the column",
                        Required = true,
                        Mode = SlotChildMode.ValueOrExpression,
                        Cardinality = SlotChildCardinality.OneOrMore,
                        Role = SlotChildRole.DynamicMap,
                        Projection = SlotChildProjection.Value,
                    },
                },
            },
            NullValue(),
        };

        // Row-list output: each line in the CSV body becomes an unnamed child
        // whose children are the column values keyed by the header row's
        // column names (resolved at synthesis time from the CSV input).
        public override IEnumerable<SlotChild> OutputChildren => new[]
        {
            new SlotChild
            {
                Name = ".",
                Type = "lambda",
                Kind = "row",
                Description = "One CSV record returned as a child node; column values appear as named children keyed by the header column name",
                Required = false,
                Mode = SlotChildMode.Value,
                Cardinality = SlotChildCardinality.ZeroOrMore,
                Role = SlotChildRole.StructuredObject,
                Projection = SlotChildProjection.StructuredTree,
                Children =
                {
                    new SlotChild
                    {
                        Name = "*",
                        Type = "string",
                        Kind = "column-value",
                        Description = "CSV column value; child name is the header column name",
                        Required = false,
                        Mode = SlotChildMode.Value,
                        Cardinality = SlotChildCardinality.ZeroOrMore,
                        Role = SlotChildRole.Option,
                        Projection = SlotChildProjection.Value,
                    },
                },
            },
        };
    }

    public class Lambda2CsvSignature : CsvSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            NullValue(),
        };
    }
}
