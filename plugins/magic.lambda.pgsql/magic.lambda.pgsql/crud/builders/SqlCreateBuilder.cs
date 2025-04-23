/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Text;
using magic.node;
using Builder = magic.data.common.builders;

namespace magic.lambda.pgsql.crud.builders
{
    /// <summary>
    /// Specialised insert SQL builder, to create an insert MySQL SQL statement
    /// by semantically traversing an input node.
    /// </summary>
    public class SqlCreateBuilder : Builder.SqlCreateBuilder
    {
        /// <summary>
        /// Creates an insert SQL statement
        /// </summary>
        /// <param name="node">Root node to generate your SQL from.</param>
        public SqlCreateBuilder(Node node)
            : base(node, "\"")
        { }

        /// <summary>
        /// Overridden to generate the tail parts of your SQL.
        /// </summary>
        /// <param name="builder">Where to put your tail.</param>
        protected override void AppendTail(StringBuilder builder)
        {
            builder.Append(" returning *");
        }
    }
}
