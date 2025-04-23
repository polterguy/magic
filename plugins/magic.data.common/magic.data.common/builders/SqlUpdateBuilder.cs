/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Text;
using magic.node;
using magic.node.extensions;

namespace magic.data.common.builders
{
    /// <summary>
    /// Specialised update SQL builder, to create a select SQL statement by semantically traversing an input node.
    /// </summary>
    public class SqlUpdateBuilder : SqlWhereBuilder
    {
        /// <summary>
        /// Creates an update SQL statement
        /// </summary>
        /// <param name="node">Root node to generate your SQL from.</param>
        /// <param name="escapeChar">Escape character to use for escaping table names etc.</param>
        /// <param name="kind">Kind of date to convert date to if date is specified in another kind</param>
        public SqlUpdateBuilder(Node node, string escapeChar, DateTimeKind kind = DateTimeKind.Unspecified)
            : base(node, escapeChar, kind)
        { }

        /// <summary>
        /// Builds your update SQL statement, and returns a structured SQL statement, plus any parameters.
        /// </summary>
        /// <returns>Node containing update SQL as root node, and parameters as children.</returns>
        public override Node Build()
        {
            // Return value.
            var result = new Node("sql");
            var builder = new StringBuilder();

            // Starting build process.
            builder.Append("update ");
            AppendTableName(builder);
            builder.Append(" set ");
            AppendValues(builder, result);
            AppendWhere(builder, result);

            // Returning result to caller.
            result.Value = builder.ToString();
            return result;
        }

        #region [ -- Private helper methods -- ]

        /*
         * Appends values, and adds values into argument node.
         */
        void AppendValues(StringBuilder builder, Node args)
        {
            var valuesNodes = Root.Children.Where(x => x.Name == "values");
            if (!valuesNodes.Any())
                throw new HyperlambdaException($"Missing [values] node in '{GetType().FullName}'");

            var valuesNode = valuesNodes.First();
            if (!valuesNode.Children.Any())
                throw new HyperlambdaException($"No actual [values] provided to '{GetType().FullName}'");

            var idxNo = 0;
            var first = true;
            foreach (var idxCol in valuesNode.Children)
            {
                if (!first)
                    builder.Append(", ");
                first = false;

                builder.Append(EscapeColumnName(idxCol.Name));
                if (idxCol.Value == null)
                {
                    builder.Append(" = null");
                    continue;
                }
                builder.Append(" = @v" + idxNo);
                var val = idxCol.GetEx<object>();
                if (Kind != DateTimeKind.Unspecified && val is DateTime dateVal && dateVal.Kind != Kind)
                    val = Kind == DateTimeKind.Local ? dateVal.ToLocalTime() : dateVal.ToUniversalTime();
                args.Add(new Node("@v" + idxNo, val));
                ++idxNo;
            }
        }

        #endregion
    }
}
