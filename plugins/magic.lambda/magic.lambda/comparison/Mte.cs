/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Numerics;
using magic.signals.contracts;
using static magic.lambda.comparison.Numbers;

namespace magic.lambda.comparison
{
    /// <summary>
    /// [mtw] slot returning true if its first child's value is "more than or equal" to its second child's value.
    /// </summary>
    [Slot(
        Name = "mte",
        Description = "Returns true if the first operand is greater than or equal to the second operand",
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "boolean",
        ReturnsDescription = "Resolves to true if the first operand is greater than or equal to the second operand",
        SignatureType = typeof(global::magic.lambda.signatures.ComparisonSignature))]
    public class Mte : BaseComparison
    {
        #region [ -- Protected overridden methods -- ]

        /// <inheritdoc />
        protected override bool Compare(object lhs, object rhs)
        {
            // Anything is more than or equal to null, and null is more than or equal to nothing but null.
            if (rhs == null)
                return true;
            if (lhs == null)
                return false;

            // Unwrap enums to their underlying numeric type
            lhs = UnwrapEnum(lhs);
            rhs = UnwrapEnum(rhs);

            // If both are numeric, allow cross-type comparison similar to [eq]
            if (IsNumeric(lhs) && IsNumeric(rhs))
                return NumericMoreThanOrEqual(lhs, rhs);

            // Non-numeric: only compare if same type, otherwise preserve original behavior
            if (lhs.GetType() != rhs.GetType())
                return false;

            return ((IComparable)lhs).CompareTo(rhs) >= 0;
        }

        #endregion

        #region [ -- Private helper methods -- ]

        static bool NumericMoreThanOrEqual(object lhs, object rhs)
        {
            // 1) If any side is decimal, prefer decimal comparison (exact for base-10)
            if (IsDecimal(lhs) || IsDecimal(rhs))
            {
                if (TryToDecimal(lhs, out var dl) && TryToDecimal(rhs, out var dr))
                    return dl >= dr;

                // Fallback to tolerant double comparison
                return DoubleMoreThanOrEqual(ToDouble(lhs), ToDouble(rhs));
            }

            // 2) If any side is floating (double/float), compare in double space with epsilon
            if (IsFloat(lhs) || IsFloat(rhs))
                return DoubleMoreThanOrEqual(ToDouble(lhs), ToDouble(rhs));

            // 3) Otherwise both are integral: compare via BigInteger to avoid overflow
            return ToBigInteger(lhs) >= ToBigInteger(rhs);
        }

        static bool DoubleMoreThanOrEqual(double l, double r)
        {
            // NaN handling: comparisons with NaN are false
            if (double.IsNaN(l) || double.IsNaN(r))
                return false;
            if (double.IsInfinity(l) || double.IsInfinity(r))
                return l >= r;

            return l > r || DoubleAlmostEqual(l, r);
        }

        #endregion
    }
}
