/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.IO;
using System.Text;
using System.Linq;
using System.Globalization;
using magic.node;

namespace magic.hyperlambda
{
    public sealed class Parser
    {
        Node _root = new Node();

        public Parser(string hyperlambda, Encoding encoding = null)
        {
            using (var reader = new StreamReader(new MemoryStream((encoding ?? Encoding.UTF8).GetBytes(hyperlambda))))
            {
                Parse(reader);
            }
        }

        public Node Lambda()
        {
            return _root;
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

                        if (idxNode.Value == null)
                            idxNode.Value = "";
                        previous = token;
                        break;

                    case "\n":
                        idxNode = null; // Making sure we create a new node on next iteration.
                        previous = token;
                        break;

                    default:

                        // Checking if token is a scope declaration.
                        if (idxNode == null &&
                            token.StartsWith(" ", StringComparison.CurrentCulture) &&
                            token.Distinct().Count() == 1)
                        {
                            // We have a scope declaration.
                            int newLevel = token.Length / 2;
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
                                while (level-- > newLevel)
                                {
                                    currentParent = currentParent.Parent;
                                }
                            }
                        }
                        else
                        {
                            if (previous == "\n")
                                currentParent = _root; // Special case for no spaces, and previous was CR.

                            if (idxNode == null)
                            {
                                idxNode = new Node();
                                currentParent.Add(idxNode);
                            }
                            if (idxNode.Name == "")
                                idxNode.Name = token;
                            else if (idxNode.Value == null || "".Equals(idxNode.Value))
                                idxNode.Value = token;
                            else
                                idxNode.Value = ConvertValue(token, idxNode.Get<string>());
                        }
                        previous = token;
                        break;
                }
            }
        }

        object ConvertValue(string value, string type)
        {
            switch (type)
            {
                case "int":
                    return Convert.ToInt32(value, CultureInfo.InvariantCulture);
                case "decimal":
                    return Convert.ToDecimal(value, CultureInfo.InvariantCulture);
                case "double":
                    return Convert.ToDouble(value, CultureInfo.InvariantCulture);
                case "bool":
                    return Convert.ToBoolean(value, CultureInfo.InvariantCulture);
                case "date":
                    return DateTime.ParseExact(value, "yyyy-MM-ddTHH:mm:ss", CultureInfo.InvariantCulture);
                case "guid":
                    return new Guid(value);
                default:
                    throw new ApplicationException($"Unknown type declaration found in Hyperlambda '{type}'");
            }
        }

        #endregion
    }
}
