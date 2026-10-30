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
    /// [lt] slot returning true if its first child's value is "less than" its second child's value.
    /// </summary>
    [Slot(
        Name = "lt",
        Description = "Returns true if the first operand is less than the second operand",
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "boolean",
        ReturnsDescription = "Resolves to true if the first operand is less than the second operand",
        SignatureType = typeof(global::magic.lambda.signatures.ComparisonSignature))]
    public class Lt : BaseComparison
    {
        #region [ -- Protected overridden methods -- ]

        /// <inheritdoc />
        protected override bool Compare(object lhs, object rhs)
        {
            // Null is less than anything but null, and nothing is less than null.
            if (rhs == null)
                return false;
            if (lhs == null)
                return true;

            // Unwrap enums to their underlying numeric type
            lhs = UnwrapEnum(lhs);
            rhs = UnwrapEnum(rhs);

            // If both are numeric, allow cross-type comparison similar to [eq]
            if (IsNumeric(lhs) && IsNumeric(rhs))
                return NumericLessThan(lhs, rhs);

            // Non-numeric: only compare if same type, otherwise preserve original behavior
            if (lhs.GetType() != rhs.GetType())
                return false;

            return ((IComparable)lhs).CompareTo(rhs) == -1;
        }

        #endregion

        #region [ -- Private helper methods -- ]

        static bool NumericLessThan(object lhs, object rhs)
        {
            // 1) If any side is decimal, prefer decimal comparison (exact for base-10)
            if (IsDecimal(lhs) || IsDecimal(rhs))
            {
                if (TryToDecimal(lhs, out var dl) && TryToDecimal(rhs, out var dr))
                    return dl < dr;

                // Fallback to tolerant double comparison
                return DoubleLessThan(ToDouble(lhs), ToDouble(rhs));
            }

            // 2) If any side is floating (double/float), compare in double space with epsilon
            if (IsFloat(lhs) || IsFloat(rhs))
                return DoubleLessThan(ToDouble(lhs), ToDouble(rhs));

            // 3) Otherwise both are integral: compare via BigInteger to avoid overflow
            return ToBigInteger(lhs) < ToBigInteger(rhs);
        }

        static bool DoubleLessThan(double l, double r)
        {
            // NaN handling: comparisons with NaN are false
            if (double.IsNaN(l) || double.IsNaN(r))
                return false;
            if (double.IsInfinity(l) || double.IsInfinity(r))
                return l < r;

            // Consider epsilon: only "less than" if strictly less and not effectively equal
            return l < r && !DoubleAlmostEqual(l, r);
        }

        static bool DoubleAlmostEqual(double a, double b, double relEps = 1e-12, double absEps = 1e-12)
        {
            double diff = Math.Abs(a - b);
            if (diff <= absEps)
                return false; // treat as "not less than" when effectively equal
            double scale = Math.Max(Math.Abs(a), Math.Abs(b));
            return diff <= relEps * scale;
        }

        #endregion
    }
}
