/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Numerics;
using magic.signals.contracts;

namespace magic.lambda.comparison
{
    /// <summary>
    /// [lte] slot returning true if its first child's value is "less than or equal" to its second child's value.
    /// </summary>
    [Slot(Name = "lte")]
    public class Lte : BaseComparison
    {
        private static bool IsDecimal(object o) => o is decimal;
        private static bool IsFloat(object o) => o is double || o is float;

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

        #region [ -- Private helper methods -- ]

        static object UnwrapEnum(object o) => o is Enum ? Convert.ChangeType(o, Enum.GetUnderlyingType(o.GetType()))! : o;

        static bool IsNumeric(object o)
        {
            switch (Type.GetTypeCode(o.GetType()))
            {
                case TypeCode.Byte:
                case TypeCode.SByte:
                case TypeCode.Int16:
                case TypeCode.UInt16:
                case TypeCode.Int32:
                case TypeCode.UInt32:
                case TypeCode.Int64:
                case TypeCode.UInt64:
                case TypeCode.Single:
                case TypeCode.Double:
                case TypeCode.Decimal:
                    return true;
                default:
                    return false;
            }
        }

        static bool TryToDecimal(object o, out decimal d)
        {
            try
            {
                switch (o)
                {
                    case decimal m: d = m; return true;
                    case byte b: d = b; return true;
                    case sbyte sb: d = sb; return true;
                    case short s: d = s; return true;
                    case ushort us: d = us; return true;
                    case int i: d = i; return true;
                    case uint ui: d = ui; return true;
                    case long l: d = l; return true;
                    case ulong ul: d = ul; return true;
                    case float f:
                        if (float.IsNaN(f) || float.IsInfinity(f)) break;
                        d = Convert.ToDecimal(f); return true;
                    case double db:
                        if (double.IsNaN(db) || double.IsInfinity(db)) break;
                        d = Convert.ToDecimal(db); return true;
                }
            }
            catch (OverflowException)
            {
            }
            d = default;
            return false;
        }

        static double ToDouble(object o)
        {
            switch (o)
            {
                case double d: return d;
                case float f: return f;
                case decimal m: return (double)m;
                case byte b: return b;
                case sbyte sb: return sb;
                case short s: return s;
                case ushort us: return us;
                case int i: return i;
                case uint ui: return ui;
                case long l: return l;
                case ulong ul: return ul;
                default: return Convert.ToDouble(o);
            }
        }

        static BigInteger ToBigInteger(object o)
        {
            switch (o)
            {
                case byte b: return b;
                case sbyte sb: return sb;
                case short s: return s;
                case ushort us: return us;
                case int i: return i;
                case uint ui: return ui;
                case long l: return l;
                case ulong ul: return ul;
                case decimal m when decimal.Truncate(m) == m:
                    return new BigInteger(m);
                default:
                    return new BigInteger(ToDouble(o));
            }
        }

        static bool DoubleAlmostEqual(double a, double b, double relEps = 1e-12, double absEps = 1e-12)
        {
            double diff = Math.Abs(a - b);
            if (diff <= absEps)
                return true;
            double scale = Math.Max(Math.Abs(a), Math.Abs(b));
            return diff <= relEps * scale;
        }

        #endregion
    }
}
