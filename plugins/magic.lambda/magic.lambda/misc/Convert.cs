/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Text;
using System.Linq;
using Sys = System;
using System.Globalization;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.node.extensions.hyperlambda;

namespace magic.lambda.misc
{
    /// <summary>
    /// [convert] slot allowing you to convert values of nodes from one type to some other type.
    /// </summary>
    [Slot(
        Name = "convert",
        Description = "Coerces a value to a different CLR type; useful for parsing strings into numbers, dates, booleans, or other strongly-typed values",
        ValueKind = "single-object",
        ValueDescription = "Expression selecting the value to convert",
        ValueRequired = true,
        ValueMode = SlotValueMode.Expression,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "",
        ReturnsDescription = "Resolves to the value converted to the requested type",
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        SignatureType = typeof(global::magic.lambda.signatures.ConvertSignature))]
    public class Convert : ISlot
    {
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var ex = input.Value as Expression ?? throw new HyperlambdaException("No expression given to [type]");
            var value = ex.Evaluate(input).Single().Value;
            var type = input.Children.FirstOrDefault()?
                .GetEx<string>() ??
                throw new HyperlambdaException("No [type] declaration found in invocation to [convert]");
            input.Clear(); // House cleaning.
            input.Value = ConvertValue(type, value);
        }

        #region [ -- Private helper methods -- ]

        /*
         * Notice, every case returns its own boxed value, to avoid the compiler unifying
         * the numeric types into one common type, which would silently widen the result.
         */
        static object ConvertValue(string type, object value)
        {
            switch (type)
            {
                case "int":
                    return Sys.Convert.ToInt32(value ?? 0, CultureInfo.InvariantCulture);

                case "uint":
                    return Sys.Convert.ToUInt32(value ?? 0, CultureInfo.InvariantCulture);

                case "short":
                    return Sys.Convert.ToInt16(value ?? 0, CultureInfo.InvariantCulture);

                case "ushort":
                    return Sys.Convert.ToUInt16(value ?? 0, CultureInfo.InvariantCulture);

                case "long":
                    return Sys.Convert.ToInt64(value ?? 0, CultureInfo.InvariantCulture);

                case "ulong":
                    return Sys.Convert.ToUInt64(value ?? 0, CultureInfo.InvariantCulture);

                case "decimal":
                    return Sys.Convert.ToDecimal(value ?? 0, CultureInfo.InvariantCulture);

                case "double":
                    return Sys.Convert.ToDouble(value ?? 0, CultureInfo.InvariantCulture);

                case "single":
                case "float":
                    return Sys.Convert.ToSingle(value ?? 0, CultureInfo.InvariantCulture);

                case "bool":
                    return value?.Equals("true") ?? false;

                case "date":
                    return Converter.ToObject(value.ToString(), "date");

                case "guid":
                    return new Guid(value?.ToString() ?? Guid.Empty.ToString());

                case "char":
                    return Sys.Convert.ToChar(value ?? 0, CultureInfo.InvariantCulture);

                case "byte":
                    return Sys.Convert.ToByte(value ?? 0, CultureInfo.InvariantCulture);

                case "x":
                    return Expression.Create(value?.ToString() ?? "");

                case "bytes":
                    return value is string strBytes ? Encoding.UTF8.GetBytes(strBytes) : null;

                case "string":
                    return value is byte[] bytes ? Encoding.UTF8.GetString(bytes) : value?.ToString() ?? "";

                case "base64":
                    return ToBase64(value);

                case "base64-url":
                    return ToBase64(value).TrimEnd('=').Replace('+', '-').Replace('/', '_');

                case "from-base64":
                    return value is string strValue ?
                        Sys.Convert.FromBase64String(strValue) :
                        throw new HyperlambdaException($"I don't know how to base64 decode {value}");

                case "node":
                    return HyperlambdaParser.Parse(value?.ToString() ?? "");

                default:
                    throw new HyperlambdaException($"Unknown type '{type}' when invoking [convert]");
            }
        }

        static string ToBase64(object value)
        {
            return value switch
            {
                byte[] bytes => Sys.Convert.ToBase64String(bytes),
                string str => Sys.Convert.ToBase64String(Encoding.UTF8.GetBytes(str)),
                _ => throw new HyperlambdaException($"I don't know how to base64 encode {value}"),
            };
        }

        #endregion
    }
}
