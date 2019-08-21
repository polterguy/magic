/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using System.Text;
using magic.node;
using magic.signals.contracts;
using magic.hyperlambda.utils;

namespace magic.data.common
{
    public class SqlCreateBuilder : SqlBuilder
    {
        readonly Action<StringBuilder> _afterValues;
        readonly Action<StringBuilder> _betweenValues;

        public SqlCreateBuilder(
            Node node,
            ISignaler signaler,
            string escapeChar,
            Action<StringBuilder> afterValues,
            Action<StringBuilder> betweenValues)
            : base(node, signaler, escapeChar)
        {
            _afterValues = afterValues;
            _betweenValues = betweenValues;
        }

        public override Node Build()
        {
            // Sanity checking for [exclude] fields.
            CheckExclusionColumns();

            // Return value.
            var result = new Node("sql");
            var builder = new StringBuilder();

            // Starting build process.
            builder.Append("insert into ");

            // Getting table name from base class.
            GetTableName(builder);

            // Building insertion [values].
            BuildValues(builder, result);

            // Invoking callback in case we've got exatr stuff after values declarations.
            _afterValues?.Invoke(builder);

            // Returning result to caller.
            result.Value = builder.ToString();
            return result;
        }

        #region [ -- Private helper methods -- ]

        void BuildValues(StringBuilder builder, Node result)
        {
            // Appending actual insertion values.
            var values = Root.Children.Where((x) => x.Name == "values");

            // Sanity checking, making sure there's exactly one [values] node.
            if (values.Count() != 1)
                throw new ApplicationException($"Exactly one [values] needs to be provided to '{GetType().FullName}'");

            // Appending column names.
            builder.Append(" (");
            var first = true;
            foreach (var idx in values.First().Children)
            {
                if (first)
                    first = false;
                else
                    builder.Append(", ");
                builder.Append(EscapeChar + idx.Name.Replace(EscapeChar, EscapeChar + EscapeChar) + EscapeChar);
            }

            // Appending actual values, as parameters.
            builder.Append(") ");
            _betweenValues?.Invoke(builder);
            builder.Append("values (");
            var idxNo = 0;
            foreach (var idx in values.First().Children)
            {
                if (idxNo > 0)
                    builder.Append(", ");
                if (idx.Value == null)
                {
                    builder.Append("null");
                }
                else
                {
                    builder.Append("@" + idxNo);
                    result.Add(new Node("@" + idxNo, idx.GetEx(Signaler)));
                    ++idxNo;
                }
            }
            builder.Append(")");
        }

        #endregion
    }
}
