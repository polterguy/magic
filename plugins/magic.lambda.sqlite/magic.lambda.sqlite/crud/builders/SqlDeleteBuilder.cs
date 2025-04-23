/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using magic.node;
using Builder = magic.data.common.builders;

namespace magic.lambda.sqlite.crud.builders
{
    /// <summary>
    /// Specialised delete SQL builder, to create a delete MySQL SQL statement
    /// by semantically traversing an input node.
    /// </summary>
    public class SqlDeleteBuilder : Builder.SqlDeleteBuilder
    {
        /// <summary>
        /// Creates a delete SQL statement
        /// </summary>
        /// <param name="node">Root node to generate your SQL from.</param>
        public SqlDeleteBuilder(Node node)
            : base(node, "\"")
        { }
    }
}
