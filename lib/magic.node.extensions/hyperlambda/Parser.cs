/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.IO;
using System.Text;
using System.Linq;
using System.Globalization;

namespace magic.node.extensions.hyperlambda
{
    public sealed class Parser
    {
        Node _root = new Node();

        public Parser(string hyperlambda)
        {
            using (var reader = new StreamReader(new MemoryStream(Encoding.UTF8.GetBytes(hyperlambda))))
            {
                Parse(reader);
            }
        }

        public Parser(Stream stream)
        {
            using (var reader = new StreamReader(stream, Encoding.UTF8))
            {
                Parse(reader);
            }
        }

        public Node Lambda()
        {
            return _root;
        }

        public static object ConvertValue(string value, string type)
        {
            switch (type)
            {
                case "string":
                    return value;
                case "int":
                    return Convert.ToInt32(value, CultureInfo.InvariantCulture);
                case "uint":
                    return Convert.ToUInt32(value, CultureInfo.InvariantCulture);
                case "long":
                    return Convert.ToInt64(value, CultureInfo.InvariantCulture);
                case "ulong":
                    return Convert.ToUInt64(value, CultureInfo.InvariantCulture);
                case "decimal":
                    return Convert.ToDecimal(value, CultureInfo.InvariantCulture);
                case "double":
                    return Convert.ToDouble(value, CultureInfo.InvariantCulture);
                case "single":
                    return Convert.ToSingle(value, CultureInfo.InvariantCulture);
                case "bool":
                    return value.Equals("true");
                case "date":
                    return DateTime.Parse(value, null, DateTimeStyles.RoundtripKind);
                case "guid":
                    return new Guid(value);
                case "char":
                    return Convert.ToChar(value, CultureInfo.InvariantCulture);
                case "byte":
                    return Convert.ToByte(value, CultureInfo.InvariantCulture);
                case "x":
                    return new Expression(value);
                case "signal":
                    return new Signal(value);
                case "node":
                    return new Parser(value).Lambda();
                default:
                    throw new ApplicationException($"Unknown type declaration found in Hyperlambda '{type}'");
            }
        }

        #region [ -- Private helper methods -- ]

        void Parse(StreamReader _reader)
        {
            var currentParent = _root;
            var tokenizer = new Tokenizer(_reader);
            var en = tokenizer.GetTokens().GetEnumerator();

            Node idxNode = null;
            string previous = null;
            int level = 0;

            while (en.MoveNext())
            {
                var token = en.Current;
                switch (token)
                {
                    case ":":
                        if (idxNode == null)
                        {
                            idxNode = new Node();
                            currentParent.Add(idxNode);
                        }
                        else if (previous == ":")
                        {
                            idxNode.Value = ":";
                            break;
                        }

                        if (idxNode.Value == null)
                            idxNode.Value = "";
                        previous = token;
                        break;

                    case "\r\n":
                        idxNode = null; // Making sure we create a new node on next iteration.
                        previous = token;
                        break;

                    default:

                        // Checking if token is a scope declaration.
                        if (idxNode == null &&
                            token.StartsWith(" ", StringComparison.CurrentCulture) &&
                            !token.Any(x => x != ' '))
                        {
                            // We have a scope declaration.
                            int newLevel = token.Length / 3;
                            if (newLevel > level + 1)
                            {
                                // Syntax error in Hyperlambda, too many consecutive SP characters.
                                throw new ApplicationException("Too many spaces found in Hyperlambda content");
                            }
                            if (newLevel == level + 1)
                            {
                                // Children collection opens up.
                                currentParent = currentParent.Children.Last();
                                level = newLevel;
                            }
                            else
                            {
                                // Propagating upwards in ancestor hierarchy.
                                while (level > newLevel)
                                {
                                    currentParent = currentParent.Parent;
                                    --level;
                                }
                            }
                        }
                        else
                        {
                            if (previous == "\r\n")
                            {
                                // Special case for no spaces, and previous was CR.
                                currentParent = _root;
                                level = 0;
                            }

                            if (idxNode == null)
                            {
                                idxNode = new Node(token);
                                currentParent.Add(idxNode);
                            }
                            else if (idxNode.Value == null || "".Equals(idxNode.Value))
                            {
                                idxNode.Value = token;
                            }
                            else
                            {
                                idxNode.Value = ConvertValue(token, idxNode.Get<string>());
                            }
                        }
                        previous = token;
                        break;
                }
            }
        }

        #endregion
    }
}
