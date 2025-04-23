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
    [Slot(Name = "convert")]
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
            switch (type)
            {
                case "int":
                    input.Value = Sys.Convert.ToInt32(value ?? 0, CultureInfo.InvariantCulture);
                    break;

                case "uint":
                    input.Value = Sys.Convert.ToUInt32(value ?? 0, CultureInfo.InvariantCulture);
                    break;

                case "short":
                    input.Value = Sys.Convert.ToInt16(value ?? 0, CultureInfo.InvariantCulture);
                    break;

                case "ushort":
                    input.Value = Sys.Convert.ToUInt16(value ?? 0, CultureInfo.InvariantCulture);
                    break;

                case "long":
                    input.Value = Sys.Convert.ToInt64(value ?? 0, CultureInfo.InvariantCulture);
                    break;

                case "ulong":
                    input.Value = Sys.Convert.ToUInt64(value ?? 0, CultureInfo.InvariantCulture);
                    break;

                case "decimal":
                    input.Value = Sys.Convert.ToDecimal(value ?? 0, CultureInfo.InvariantCulture);
                    break;

                case "double":
                    input.Value = Sys.Convert.ToDouble(value ?? 0, CultureInfo.InvariantCulture);
                    break;

                case "single":
                case "float":
                    input.Value = Sys.Convert.ToSingle(value ?? 0, CultureInfo.InvariantCulture);
                    break;

                case "bool":
                    input.Value = value?.Equals("true") ?? false;
                    break;

                case "date":
                    input.Value = Converter.ToObject(value.ToString(), "date");
                    break;

                case "guid":
                    input.Value = new Guid(value?.ToString() ?? Guid.Empty.ToString());
                    break;

                case "char":
                    input.Value = Sys.Convert.ToChar(value ?? 0, CultureInfo.InvariantCulture);
                    break;

                case "byte":
                    input.Value = Sys.Convert.ToByte(value ?? 0, CultureInfo.InvariantCulture);
                    break;

                case "x":
                    input.Value = new Expression(value?.ToString() ?? "");
                    break;

                case "bytes":
                    if (value is string strBytes)
                        input.Value = Encoding.UTF8.GetBytes(strBytes);
                    else
                        input.Value = null;
                    break;

                case "string":
                    if (value is byte[] bytes)
                        input.Value = Encoding.UTF8.GetString(bytes);
                    else
                        input.Value = value?.ToString() ?? "";
                    break;

                case "base64":
                    if (value is byte[] bytes2)
                        input.Value = Sys.Convert.ToBase64String(bytes2);
                    else if (value is string str)
                        input.Value = Sys.Convert.ToBase64String(Encoding.UTF8.GetBytes(str));
                    else
                        throw new HyperlambdaException($"I don't know how to base64 encode {value}");
                    break;

                case "base64-url":
                    if (value is byte[] bytes3)
                        input.Value = Sys.Convert
                            .ToBase64String(bytes3)
                            .TrimEnd('=')
                            .Replace('+', '-')
                            .Replace('/', '_');
                    else if (value is string str)
                        input.Value = Sys.Convert
                            .ToBase64String(Encoding.UTF8.GetBytes(str))
                            .TrimEnd('=')
                            .Replace('+', '-')
                            .Replace('/', '_');
                    else
                        throw new HyperlambdaException($"I don't know how to base64 encode {value}");
                    break;

                case "from-base64":
                    if (value is string strValue)
                        input.Value = Sys.Convert.FromBase64String(strValue);
                    else
                        throw new HyperlambdaException($"I don't know how to base64 decode {value}");
                    break;

                case "node":
                    input.Value = HyperlambdaParser.Parse(value?.ToString() ?? "");
                    break;

                default:
                    throw new HyperlambdaException($"Unknown type '{type}' when invoking [convert]");
            }
        }
    }
}
