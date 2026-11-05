/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Collections.Generic;
using magic.signals.contracts;

namespace magic.lambda.math.signatures
{
    public class ArithmeticSignature : ISlotSignature
    {
        public IEnumerable<SlotChild> Children => new[]
        {
            new SlotChild
            {
                Name = "*",
                Type = "number",
                Kind = "number",
                Description = "Numeric operand evaluated before calculating the result",
                Required = true,
                Mode = SlotChildMode.ExecutableLambda,
                Cardinality = SlotChildCardinality.TwoOrMore,
                // OperandPaired (not Operand): arithmetic operations combine
                // their operands; mixing numeric subtypes (decimal + int)
                // produces ambiguous coercion. The synth narrows subsequent
                // operands to the first operand's specific numeric kind so
                // the corpus shows consistent typing in math chains.
                Role = SlotChildRole.OperandPaired,
                Evaluation = SlotChildEvaluation.EvalSelf,
                Projection = SlotChildProjection.Value,
            },
        };
    }

    public class DotProductSignature : ISlotSignature
    {
        public IEnumerable<SlotChild> Children => new[]
        {
            new SlotChild
            {
                Name = "*",
                Type = "lambda",
                Description = "Vector operand evaluated before calculating the dot product",
                Required = true,
                Mode = SlotChildMode.ExecutableLambda,
                Cardinality = SlotChildCardinality.ExactlyTwo,
                // OperandPaired (not Operand): dot product takes two
                // VECTORS that must share an element type for the
                // element-wise product to be meaningful. Sibling-kind
                // narrowing keeps both vectors of the same element kind.
                Role = SlotChildRole.OperandPaired,
                Evaluation = SlotChildEvaluation.EvalSelf,
                Projection = SlotChildProjection.Children,
            },
        };
    }

    public class IncrementDecrementSignature : ISlotSignature
    {
        public IEnumerable<SlotChild> Children => new[]
        {
            new SlotChild
            {
                Name = "step",
                Type = "number",
                Description = "Amount to add to or subtract from each selected node",
                Required = false,
                Mode = SlotChildMode.ValueOrExpression,
                Cardinality = SlotChildCardinality.ZeroOrOne,
                DefaultValue = "1",
                Role = SlotChildRole.Option,
                Projection = SlotChildProjection.Value,
            },
        };
    }

    public class RandomSignature : ISlotSignature
    {
        public IEnumerable<SlotChild> Children => new[]
        {
            new SlotChild
            {
                Name = "min",
                Type = "int",
                Kind = "validator-min-integer",
                Description = "Inclusive lower bound; requires [max] and must appear before it",
                Required = false,
                Mode = SlotChildMode.ValueOrExpression,
                Cardinality = SlotChildCardinality.ZeroOrOne,
                Role = SlotChildRole.Option,
                Projection = SlotChildProjection.Value,
            },
            new SlotChild
            {
                Name = "max",
                Type = "int",
                Kind = "validator-max-integer",
                Description = "Exclusive upper bound; when supplied without [min], the lower bound is 0",
                Required = false,
                Mode = SlotChildMode.ValueOrExpression,
                Cardinality = SlotChildCardinality.ZeroOrOne,
                Role = SlotChildRole.Option,
                Projection = SlotChildProjection.Value,
            },
        };

        public IEnumerable<SlotConstraint> Constraints
        {
            get
            {
                var result = new SlotConstraint
                {
                    Kind = SlotConstraintKind.Requires,
                    Target = "min",
                    Description = "[min] requires [max]",
                };
                result.Values.Add("max");
                return new[] { result };
            }
        }
    }
}
