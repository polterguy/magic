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
    [Slot(Name = "lambda2csv")]
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

            // Looping through each node we should transform to a CSV record.
            var first = true;
            foreach (var idx in input.Evaluate())
            {
                // Checking if this is the first record, at which point we create headers for CSV file.
                if (first)
                {
                    // Creating CSV headers.
                    first = false;
                    CreateHeaders(idx, builder, types);
                }

                // Looping through each child node of currently iterated record, to create our cells.
                CreateRecord(idx, builder, nullValue, types);
            }

            // Returning CSV content to caller.
            input.Value = builder.ToString();
            input.AddRange(types.Select(x => new Node(x.Item1, x.Item2)));
        }

        #region [ -- Private helper methods -- ]

        /*
         * Appends one single record into specified StringBuilder.
         */
        void CreateRecord(
            Node current,
            StringBuilder builder,
            string nullValue,
            List<Tuple<string, string>> types)
        {
            // Looping through each child node of currently iterated record, to create our cells.
            var firstValue = true;
            var index = 0;
            foreach (var idxValue in current.Children)
            {
                if (firstValue)
                    firstValue = false;
                else
                    builder.Append(",");
                var value = idxValue.Value;

                // Making sure we escape string values correctly.
                if (value == null)
                {
                    builder.Append(nullValue);
                }
                else
                {
                    if (value is string)
                        builder.Append("\"" + idxValue.GetEx<string>().ToString().Replace("\"", "\"\"") + "\"");
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
        void CreateHeaders(
            Node current,
            StringBuilder builder,
            List<Tuple<string, string>> types)
        {
            var firstHeader = true;
            foreach (var idxHeader in current.Children.Select(x => x.Name))
            {
                if (firstHeader)
                    firstHeader = false;
                else
                    builder.Append(",");
                builder.Append(idxHeader);
                types.Add(new Tuple<string, string>(idxHeader, null));
            }
            builder.Append("\r\n");
        }

        /*
         * Helper method to retrieve null string value if existing.
         */
        string GetNullableValue(Node input)
        {
            string nullValue = "[NULL]";
            var nullArgument = input.Children.FirstOrDefault(x => x.Name == "null-value");
            if (nullArgument != null)
                nullValue = nullArgument.GetEx<string>();
            return nullValue;
        }

        #endregion
    }
}
