/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using magic.node;
using Builder = magic.data.common.builders;

namespace magic.lambda.sqlite.crud.builders
{
    /// <summary>
    /// Specialised insert SQL builder, to create an insert MySQL SQL statement
    /// by semantically traversing an input node, that does not return the ID
    /// of the newly created record.
    /// </summary>
    public class SqlCreateBuilderNoId : Builder.SqlCreateBuilder
    {
        /// <summary>
        /// Creates an insert SQL statement
        /// </summary>
        /// <param name="node">Root node to generate your SQL from.</param>
        public SqlCreateBuilderNoId(Node node)
            : base(node, "\"")
        { }
    }
}
