/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using magic.node;
using Builder = magic.data.common.builders;

namespace magic.lambda.mysql.crud.builders
{
    /// <summary>
    /// Specialised select SQL builder, to create a select MySQL SQL statement
    /// by semantically traversing an input node.
    /// </summary>
    public class SqlReadBuilder : Builder.SqlReadBuilder
    {
        /// <summary>
        /// Creates a select SQL statement
        /// </summary>
        /// <param name="node">Root node to generate your SQL from.</param>
        public SqlReadBuilder(Node node)
            : base(node, "`", DateTimeKind.Local)
        { }
    }
}
