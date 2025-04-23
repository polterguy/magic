/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using magic.node;
using Builder = magic.data.common.builders;

namespace magic.lambda.mysql.crud.builders
{
    /// <summary>
    /// Specialised update SQL builder, to create a select MySQL SQL statement
    /// by semantically traversing an input node.
    /// </summary>
    public class SqlUpdateBuilder : Builder.SqlUpdateBuilder
    {
        /// <summary>
        /// Creates an update SQL statement
        /// </summary>
        /// <param name="node">Root node to generate your SQL from.</param>
        public SqlUpdateBuilder(Node node)
            : base(node, "`")
        { }
    }
}
