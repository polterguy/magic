/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.IO;
using System.Text;
using System.Globalization;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using magic.node;

namespace magic.hyperlambda
{
    public sealed class Parser
    {
        public IEnumerable<Node> Parse(string content)
        {
            using (var stream = new MemoryStream(Encoding.UTF8.GetBytes(content)))
            {
                foreach (var idx in Parse(stream))
                {
                    yield return idx;
                }
            }
        }

        public IEnumerable<Node> Parse(Stream stream)
        {
            using (var reader = new StreamReader(stream))
            {
                while(!reader.EndOfStream)
                {
                    var buffer = GetNode(reader);
                    if (buffer != null)
                        yield return buffer;
                }
            }
        }

        #region [ -- Private helper methods -- ]

        Node GetNode(StreamReader reader)
        {
            Node retVal = null;

            var name = GetToken(reader, out bool colonName);
            if (name == null)
                return null;

            var value = GetToken(reader, out bool colonValue);
            if (!colonName && value == "")
            {
                retVal = new Node(name, null);
            }
            else if (colonValue)
            {
                // Current value is actually a type.
                var actualValue = GetToken(reader, out colonValue);
                var convertedValue = ConvertValue(actualValue, value);
                retVal = new Node(name.ToString(), convertedValue);
            }
            else
            {
                retVal = new Node(name, value);
            }

            // TODO: Check for child nodes here.
            return retVal;
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
                case "regex":
                    return new Regex(value);
                default:
                    throw new ApplicationException($"Unknown type declaration found in Hyperlambda '{type}'");
            }
        }

        string GetToken(StreamReader reader, out bool colon)
        {
            var builder = new StringBuilder();
            colon = false;
            while(!reader.EndOfStream)
            {
                var idx = (char)reader.Read();
                switch(idx)
                {
                    case ':':
                        colon = true;
                        return builder.ToString();
                    case '\r':
                        if (reader.Read() != '\n')
                            throw new ApplicationException("Syntax error in Hyperlambda file. Wrong CR/LF sequence found.");
                        return builder.ToString();
                    case '\n':
                        return builder.ToString();
                    default:
                        builder.Append(idx);
                        break;
                }
            }
            return builder.ToString();
        }

        #endregion
    }
}
