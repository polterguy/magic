/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using System.Text;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.data.common
{
    public abstract class SqlCreateBuilder : SqlBuilder
    {
        public SqlCreateBuilder(Node node, ISignaler signaler, string escapeChar)
            : base(node, signaler, escapeChar)
        { }

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

            // In case derived class wants to inject something here ...
            GetTail(builder);

            // Returning result to caller.
            result.Value = builder.ToString();
            return result;
        }

        #region [ -- Protected helper methods -- ]

        protected virtual void BuildValues(StringBuilder builder, Node result)
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
            builder.Append(")");

            // In case derived class wants to inject something here ...
            GetInBetween(builder);

            builder.Append(" values (");
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

        protected virtual void GetTail(StringBuilder builder)
        { }

        protected virtual void GetInBetween(StringBuilder builder)
        { }

        #endregion
    }
}
