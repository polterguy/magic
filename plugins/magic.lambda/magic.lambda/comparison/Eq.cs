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
    /// [eq] slot allowing you to compare two values for equality.
    /// </summary>
    [Slot(
        Name = "eq",
        Description = "Returns true if two operands are equal",
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "boolean",
        ReturnsDescription = "Resolves to true if the operands are equal",
        SignatureType = typeof(global::magic.lambda.signatures.ComparisonSignature))]
    public class Eq : BaseComparison
    {
        #region [ -- Protected overridden methods -- ]

        protected override bool Compare(object lhs, object rhs)
        {
            if (lhs is null || rhs is null)
                return lhs is null && rhs is null;

            // Unwrap enums to their underlying numeric type
            lhs = UnwrapEnum(lhs);
            rhs = UnwrapEnum(rhs);

            if (!IsNumeric(lhs) || !IsNumeric(rhs))
                return Equals(lhs, rhs);

            // 1) If any side is decimal, prefer decimal comparison (exact for base-10)
            if (IsDecimal(lhs) || IsDecimal(rhs))
                return DecimalEquals(lhs, rhs);

            // 2) If any side is floating (double/float), use double with epsilon
            if (IsFloat(lhs) || IsFloat(rhs))
                return FloatEquals(lhs, rhs);

            // 3) Otherwise both are integral: compare via BigInteger to avoid overflow
            return ToBigInteger(lhs) == ToBigInteger(rhs);
        }

        #endregion

        #region [ -- Private helper methods -- ]

        static bool DecimalEquals(object lhs, object rhs)
        {
            if (TryToDecimal(lhs, out var dl) && TryToDecimal(rhs, out var dr))
                return dl == dr;
            return DoubleAlmostEqual(ToDouble(lhs), ToDouble(rhs));
        }

        static bool FloatEquals(object lhs, object rhs)
        {
            double dl = ToDouble(lhs);
            double dr = ToDouble(rhs);

            // NaN handling: treat NaN as unequal to everything (including NaN)
            if (double.IsNaN(dl) || double.IsNaN(dr))
                return false;

            // +∞==+∞, -∞==-∞
            if (double.IsInfinity(dl) || double.IsInfinity(dr))
                return dl.Equals(dr);

            return DoubleAlmostEqual(dl, dr);
        }

        #endregion
    }
}
