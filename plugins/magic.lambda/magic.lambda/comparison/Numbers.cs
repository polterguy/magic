/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Numerics;

namespace magic.lambda.comparison
{
    /*
     * Numeric helpers shared by the comparison operators, such that [eq], [mt], [mte], [lt]
     * and [lte] all convert and compare numbers of different types in exactly the same way.
     */
    static class Numbers
    {
        internal static bool IsDecimal(object o) => o is decimal;

        internal static bool IsFloat(object o) => o is double || o is float;

        internal static object UnwrapEnum(object o) => o is Enum ? Convert.ChangeType(o, Enum.GetUnderlyingType(o.GetType())) : o;

        internal static bool IsNumeric(object o)
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

        internal static bool TryToDecimal(object o, out decimal d)
        {
            // Exact/finite conversions to decimal. Doubles/floats may overflow decimal if huge or be non-finite.
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
                        d = Convert.ToDecimal(f); return true; // may round but stays finite
                    case double db:
                        if (double.IsNaN(db) || double.IsInfinity(db)) break;
                        // Might overflow decimal if |db| > ~7.9e28
                        d = Convert.ToDecimal(db); return true;
                }
            }
            catch (OverflowException)
            {
                // fall through to failure
            }
            d = default;
            return false;
        }

        internal static double ToDouble(object o)
        {
            switch (o)
            {
                case double d: return d;
                case float f: return f;
                case decimal m: return (double)m; // safe (decimal range < double range)
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

        internal static BigInteger ToBigInteger(object o)
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
                // If a decimal has no fractional part, it can be converted exactly
                case decimal m when decimal.Truncate(m) == m:
                    return new BigInteger(m);
                default:
                    // For any other numeric, round-trip via decimal if integral, else via double (not ideal).
                    // This path is rarely hit with the logic above.
                    return new BigInteger(ToDouble(o));
            }
        }

        // Relative+absolute epsilon, good default for general app use
        internal static bool DoubleAlmostEqual(double a, double b, double relEps = 1e-12, double absEps = 1e-12)
        {
            double diff = Math.Abs(a - b);
            if (diff <= absEps)
                return true;
            double scale = Math.Max(Math.Abs(a), Math.Abs(b));
            return diff <= relEps * scale;
        }
    }
}
