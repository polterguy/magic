/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Text;
using magic.node;

namespace magic.data.common.builders
{
    /// <summary>
    /// Specialised delete SQL builder, to create a delete SQL statement by
    /// semantically traversing an input node.
    /// </summary>
    public class SqlDeleteBuilder : SqlWhereBuilder
    {
        /// <summary>
        /// Creates a delete SQL statement
        /// </summary>
        /// <param name="node">Root node to generate your SQL from.</param>
        /// <param name="escapeChar">Escape character to use for escaping table names etc.</param>
        /// <param name="kind">Kind of date to convert date to if date is specified in another kind</param>
        public SqlDeleteBuilder(Node node, string escapeChar, DateTimeKind kind = DateTimeKind.Unspecified)
            : base(node, escapeChar, kind)
        { }

        /// <summary>
        /// Builds your delete SQL statement, and returns a structured SQL statement, plus any parameters.
        /// </summary>
        /// <returns>Node containing insert SQL as root node, and parameters as children.</returns>
        public override Node Build()
        {
            // Return value.
            var result = new Node("sql");
            var builder = new StringBuilder();

            // Starting build process.
            builder.Append("delete from ");
            AppendTableName(builder);
            AppendWhere(builder, result);

            // Returning result to caller.
            result.Value = builder.ToString();
            return result;
        }
    }
}
