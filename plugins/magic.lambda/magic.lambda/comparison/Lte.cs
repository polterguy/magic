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
    /// [lte] slot returning true if its first child's value is "less than or equal" to its second child's value.
    /// </summary>
    [Slot(
        Name = "lte",
        Description = "Returns true if the first operand is less than or equal to the second operand",
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "boolean",
        ReturnsDescription = "Resolves to true if the first operand is less than or equal to the second operand",
        SignatureType = typeof(global::magic.lambda.signatures.ComparisonSignature))]
    public class Lte : BaseComparison
    {
        #region [ -- Protected overridden methods -- ]

        /// <inheritdoc />
        protected override bool Compare(object lhs, object rhs)
        {
            if (lhs == null && rhs == null)
                return true;
            else if (lhs != null && rhs == null)
                return false;
            else if (lhs == null)
                return true;

            // Unwrap enums to their underlying numeric type
            lhs = UnwrapEnum(lhs);
            rhs = UnwrapEnum(rhs);

            if (IsNumeric(lhs) && IsNumeric(rhs))
            {
                // 1) Decimal path
                if (IsDecimal(lhs) || IsDecimal(rhs))
                {
                    if (TryToDecimal(lhs, out var dl) && TryToDecimal(rhs, out var dr))
                        return dl <= dr;

                    double l = ToDouble(lhs);
                    double r = ToDouble(rhs);

                    if (double.IsNaN(l) || double.IsNaN(r)) return false;
                    if (double.IsInfinity(l) || double.IsInfinity(r))
                        return l <= r;

                    return l < r || DoubleAlmostEqual(l, r);
                }

                // 2) Float/double path
                if (IsFloat(lhs) || IsFloat(rhs))
                {
                    double l = ToDouble(lhs);
                    double r = ToDouble(rhs);

                    if (double.IsNaN(l) || double.IsNaN(r)) return false;
                    if (double.IsInfinity(l) || double.IsInfinity(r))
                        return l <= r;

                    return l < r || DoubleAlmostEqual(l, r);
                }

                // 3) Integral path
                return ToBigInteger(lhs) <= ToBigInteger(rhs);
            }

            // Non-numeric: only compare if same type
            else if (lhs.GetType() != rhs.GetType())
                return false;

            return ((IComparable)lhs).CompareTo(rhs) <= 0;
        }

        #endregion
    }
}
