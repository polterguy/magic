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
    /// Specialised insert SQL builder, to create an insert SQL statement by semantically traversing an input node.
    /// </summary>
    public class SqlCreateBuilder : SqlBuilder
    {
        /// <summary>
        /// Creates an insert SQL statement
        /// </summary>
        /// <param name="node">Root node to generate your SQL from.</param>
        /// <param name="escapeChar">Escape character to use for escaping table names etc.</param>
        /// <param name="kind">Kind of date to convert date to if date is specified in another kind</param>
        public SqlCreateBuilder(Node node, string escapeChar, DateTimeKind kind = DateTimeKind.Unspecified)
            : base(node, escapeChar, kind)
        { }

        /// <summary>
        /// Builds your insert SQL statement, and returns a structured SQL statement, plus any parameters.
        /// </summary>
        /// <returns>Node containing insert SQL as root node, and parameters as children.</returns>
        public override Node Build()
        {
            // Return value.
            var result = new Node("sql");
            var builder = new StringBuilder();

            // Starting build process.
            builder.Append("insert into ");
            AppendTableName(builder);
            AppendValues(builder, result);
            AppendTail(builder);

            // Returning result to caller.
            result.Value = builder.ToString();
            return result;
        }

        #region [ -- Protected virtual helper methods -- ]

        /// <summary>
        /// Adds the 'values' parts of your SQL to the specified string builder.
        /// </summary>
        /// <param name="builder">String builder to put the results into.</param>
        /// <param name="args">Current input node from where to start looking for semantic values parts.</param>
        protected virtual void AppendValues(StringBuilder builder, Node args)
        {
            // Appending actual insertion values.
            var valuesNodes = Root.Children.Where(x => x.Name == "values");

            // Sanity checking, making sure there's exactly one [values] node.
            if (valuesNodes.Count() != 1)
                throw new HyperlambdaException($"Exactly one [values] needs to be provided to '{GetType().FullName}'");

            // Extracting single values node, and sanity checking it.
            var valuesNode = valuesNodes.First();

            // Sanity checking that we've actually got any values to insert.
            if (!valuesNode.Children.Any())
                throw new HyperlambdaException("No [values] found in lambda");

            // Appending column names.
            AppendColumnNames(builder, valuesNode);

            // In case derived class wants to inject something here ...
            AppendInBetween(builder);

            // Appending arguments.
            AppendAndAddArguments(builder, valuesNode, args);
        }

        /// <summary>
        /// Adds "in between" parts to your SQL, which might include specialized SQL text,
        /// depending upon your adapter.
        /// Default implementation does nothing.
        /// </summary>
        /// <param name="builder">Where to put the resulting in between parts.</param>
        protected virtual void AppendInBetween(StringBuilder builder)
        { }

        /// <summary>
        /// Appends the tail for your SQL statement, which by default is none.
        /// This is useful for situations where you'll need to for instance explicitly
        /// return the ID of a newly created item.
        /// </summary>
        /// <param name="builder">Where to put your tail.</param>
        protected virtual void AppendTail(StringBuilder builder)
        { }

        #endregion

        #region [ -- Private helper methods -- ]

        /*
         * Appends names of all columns that should be updated to the resulting SQL.
         */
        void AppendColumnNames(
            StringBuilder builder,
            Node values)
        {
            builder.Append(" (");
            var idxNo = 0;
            foreach (var idx in values.Children)
            {
                if (idxNo++ > 0)
                    builder.Append(", ");
                builder.Append(EscapeColumnName(idx.Name));
            }
            builder.Append(")");
        }

        /*
         * Appends names of all arguments, and adds all arguments to resulting lambda.
         */
        void AppendAndAddArguments(
            StringBuilder builder,
            Node values,
            Node args)
        {
            builder.Append(" values (");
            var idxNo = 0;
            var first = true;
            foreach (var idx in values.Children)
            {
                if (!first)
                    builder.Append(", ");
                first = false;

                if (idx.Value == null)
                {
                    builder.Append("null");
                    continue;
                }
                builder.Append("@" + idxNo);
                var val = idx.GetEx<object>();
                if (Kind != DateTimeKind.Unspecified && val is DateTime dateVal && dateVal.Kind != Kind)
                    val = Kind == DateTimeKind.Local ? dateVal.ToLocalTime() : dateVal.ToUniversalTime();
                args.Add(new Node("@" + idxNo, val));
                ++idxNo;
            }
            builder.Append(")");
        }

        #endregion
    }
}
