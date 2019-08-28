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
    public class SqlUpdateBuilder : SqlBuilder
    {
        public SqlUpdateBuilder(Node node, ISignaler signaler, string escapeChar)
            : base(node, signaler, escapeChar)
        { }

        public override Node Build()
        {
            // Sanity checking for [exclude] fields.
            CheckExclusionColumns();

            // Return value.
            var result = new Node("sql");
            var builder = new StringBuilder();

            // Building SQL text and parameter collection.
            builder.Append("update ");

            // Getting table name from base class.
            GetTableName(builder);

            // Adding set
            builder.Append(" set ");

            // Adding [values].
            GetValues(builder, result);

            // Getting [where] clause.
            BuildWhere(result, builder);

            // Returning result to caller.
            result.Value = builder.ToString();
            return result;
        }

        #region [ -- Private helper methods -- ]

        void GetValues(StringBuilder builder, Node result)
        {
            var valuesNodes = Root.Children.Where((x) => x.Name == "values");
            if (!valuesNodes.Any() || !valuesNodes.First().Children.Any())
                throw new ApplicationException($"Missing [values] node in '{GetType().FullName}'");

            var idxNo = 0;
            foreach (var idxCol in valuesNodes.First().Children)
            {
                if (idxNo > 0)
                    builder.Append(", ");
                builder.Append(EscapeChar + idxCol.Name.Replace(EscapeChar, EscapeChar + EscapeChar) + EscapeChar);
                if (idxCol.Value == null)
                {
                    builder.Append(" = null");
                }
                else
                {
                    builder.Append(" = @v" + idxNo);
                    result.Add(new Node("@v" + idxNo, idxCol.GetEx(Signaler)));
                    ++idxNo;
                }
            }
        }

        #endregion
    }
}
