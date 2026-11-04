/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Text;
using System.Collections.Generic;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.csv
{
    /// <summary>
    /// [lambda2csv] slot for transforming a lambda hierarchy to a CSV string.
    /// </summary>
    [Slot(
        Name = "lambda2csv",
        Description = "Transforms a lambda hierarchy into CSV",
        ValueKind = "node-list",
        ValueDescription = "Expression selecting the nodes (rows) to transform",
        ValueRequired = true,
        ValueMode = SlotValueMode.Expression,
        ReturnsMode = SlotReturnsMode.Both,
        ReturnsKind = "csv,text",
        ReturnsDescription = "Resolves to the CSV content in value and column type nodes as children",
        SignatureType = typeof(global::magic.lambda.csv.signatures.Lambda2CsvSignature))]
    public class Lambda2Csv : ISlot
    {
        /// <summary>
        /// Slot implementation.
        /// </summary>
        /// <param name="signaler">Signaler that raised signal.</param>
        /// <param name="input">Arguments to slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            // Buffer to keep CSV data.
            var builder = new StringBuilder();

            // List containing type information.
            var types = new List<Tuple<string, string>>();

            // Retrieving nullable argument.
            string nullValue = GetNullableValue(input);

            // Checking if caller wants to neutralise spreadsheet formula-injection (defaults to true).
            var escapeFormulas = GetEscapeFormulas(input);

            // Looping through each node we should transform to a CSV record.
            var first = true;
            foreach (var idx in input.Evaluate())
            {
                // Checking if this is the first record, at which point we create headers for CSV file.
                if (first)
                {
                    // Creating CSV headers.
                    first = false;
                    CreateHeaders(idx, builder, types, escapeFormulas);
                }

                // Looping through each child node of currently iterated record, to create our cells.
                CreateRecord(idx, builder, nullValue, types, escapeFormulas);
            }

            // Returning CSV content to caller.
            input.Value = builder.ToString();
            input.AddRange(types.Select(x => new Node(x.Item1, x.Item2)));
        }

        #region [ -- Private helper methods -- ]

        /*
         * Appends one single record into specified StringBuilder.
         */
        static void CreateRecord(
            Node current,
            StringBuilder builder,
            string nullValue,
            List<Tuple<string, string>> types,
            bool escapeFormulas)
        {
            // Looping through each child node of currently iterated record, to create our cells.
            var firstValue = true;
            var index = 0;
            foreach (var idxValue in current.Children)
            {
                if (firstValue)
                    firstValue = false;
                else
                    builder.Append(',');
                var value = idxValue.Value;

                // Making sure we escape string values correctly.
                if (value == null)
                {
                    builder.Append(nullValue);
                }
                else
                {
                    if (value is string)
                        builder.Append(EscapeString(idxValue.GetEx<string>(), escapeFormulas));
                    else
                        builder.Append(Converter.ToString(value).Item2);
                    if (types[index].Item2 == null)
                        types[index] = new Tuple<string, string>(types[index].Item1, Converter.ToString(value).Item1);
                }
                index ++;
            }
            builder.Append("\r\n");
        }

        /*
         * Appends headers into specified string builder.
         */
        static void CreateHeaders(
            Node current,
            StringBuilder builder,
            List<Tuple<string, string>> types,
            bool escapeFormulas)
        {
            var firstHeader = true;
            foreach (var idxHeader in current.Children.Select(x => x.Name))
            {
                if (firstHeader)
                    firstHeader = false;
                else
                    builder.Append(',');
                builder.Append(EscapeHeader(idxHeader, escapeFormulas));
                types.Add(new Tuple<string, string>(idxHeader, null));
            }
            builder.Append("\r\n");
        }

        /*
         * Helper method to retrieve null string value if existing.
         */
        static string GetNullableValue(Node input)
        {
            string nullValue = "[NULL]";
            var nullArgument = input.Children.FirstOrDefault(x => x.Name == "null-value");
            if (nullArgument != null)
                nullValue = nullArgument.GetEx<string>();
            return nullValue;
        }

        /*
         * Helper method to determine whether spreadsheet formula-injection should be
         * neutralised. Defaults to true, and can be turned off with [escape-formulas]
         * for pure data-interchange scenarios where lossless round-tripping matters.
         */
        static bool GetEscapeFormulas(Node input)
        {
            var argument = input.Children.FirstOrDefault(x => x.Name == "escape-formulas");
            if (argument != null)
                return argument.GetEx<bool>();
            return true;
        }

        /*
         * CSV-quotes a string cell, doubling embedded quotes, and optionally neutralises
         * spreadsheet formula-injection first by prefixing a leading formula character
         * with a single quote so Excel/Sheets/LibreOffice treat the cell as literal text.
         */
        static string EscapeString(string value, bool escapeFormulas)
        {
            if (escapeFormulas)
                value = NeutraliseFormula(value);
            return "\"" + value.Replace("\"", "\"\"") + "\"";
        }

        /*
         * Characters that force a CSV field to be quoted per RFC 4180.
         */
        static readonly char[] _quotableChars = new[] { ',', '"', '\r', '\n' };

        /*
         * Escapes a header (column name). Formula-injection is neutralised the same way
         * as cells, and the field is quoted only when it contains a character that would
         * otherwise break the CSV structure (comma, quote, CR or LF).
         */
        static string EscapeHeader(string header, bool escapeFormulas)
        {
            if (escapeFormulas)
                header = NeutraliseFormula(header);
            if (header.IndexOfAny(_quotableChars) != -1)
                return "\"" + header.Replace("\"", "\"\"") + "\"";
            return header;
        }

        /*
         * Prefixes a leading formula character with a single quote so spreadsheet
         * applications do not evaluate the value as a formula when the CSV is opened.
         */
        static string NeutraliseFormula(string value)
        {
            if (!string.IsNullOrEmpty(value) && "=+-@\t\r".IndexOf(value[0]) != -1)
                return "'" + value;
            return value;
        }

        #endregion
    }
}
