/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using System.Globalization;
using System.Collections.Generic;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.node.extensions.hyperlambda;

namespace magic.lambda.change
{
    [Slot(Name = "convert")]
    public class Convert : ISlot, IMeta
    {
        readonly ISignaler _signaler;

        public Convert(ISignaler signaler)
        {
            _signaler = signaler ?? throw new ArgumentNullException(nameof(signaler));
        }

        public void Signal(Node input)
        {
            if (input.Children.Count() != 1 || !input.Children.Any((x) => x.Name == "type"))
                throw new ApplicationException("[convert] can only handle one argument, which is [type]");

            var type = input.Children.First().Get<string>();

            var value = input.GetEx(_signaler);
            if (value == null)
            {
                input.Value = null;
                return;
            }

            switch (type)
            {
                case "int":
                    input.Value = System.Convert.ToInt32(value, CultureInfo.InvariantCulture);
                    break;

                case "uint":
                    input.Value = System.Convert.ToUInt32(value, CultureInfo.InvariantCulture);
                    break;

                case "long":
                    input.Value = System.Convert.ToInt64(value, CultureInfo.InvariantCulture);
                    break;

                case "ulong":
                    input.Value = System.Convert.ToUInt64(value, CultureInfo.InvariantCulture);
                    break;

                case "decimal":
                    input.Value = System.Convert.ToDecimal(value, CultureInfo.InvariantCulture);
                    break;

                case "double":
                    input.Value = System.Convert.ToDouble(value, CultureInfo.InvariantCulture);
                    break;

                case "single":
                    input.Value = System.Convert.ToSingle(value, CultureInfo.InvariantCulture);
                    break;

                case "bool":
                    input.Value = value.Equals("true");
                    break;

                case "date":
                    input.Value = DateTime.ParseExact(value.ToString(), "yyyy-MM-ddTHH:mm:ss", CultureInfo.InvariantCulture);
                    break;

                case "guid":
                    input.Value = new Guid(value.ToString());
                    break;

                case "char":
                    input.Value = System.Convert.ToChar(value, CultureInfo.InvariantCulture);
                    break;

                case "byte":
                    input.Value = System.Convert.ToByte(value, CultureInfo.InvariantCulture);
                    break;

                case "x":
                    input.Value = new Expression(value.ToString());
                    break;

                case "string":
                    input.Value = value.ToString();
                    break;

                case "node":
                    input.Value = new Parser(value.ToString()).Lambda();
                    break;

                default:
                    throw new ApplicationException($"Unknown type '{type}' when invoking [convert]");
            }
        }

        public IEnumerable<Node> GetArguments()
        {
            yield return new Node(":", "*");
            yield return new Node("type", 1);
        }
    }
}
