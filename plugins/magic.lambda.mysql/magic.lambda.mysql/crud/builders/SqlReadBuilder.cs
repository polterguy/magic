/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System;
using System.Linq;
using System.Collections.Generic;
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

        /*
         * Functions of the MySQL dialect allowed in column, group and order expressions, in
         * addition to the ones every database has.
         */
        static readonly string[] _dialectFunctions = new[]
        {
            "date_format", "year", "month", "day", "ifnull", "rand", "concat", "substring", "trim",
        };

        /// <inheritdoc />
        protected override IEnumerable<string> Functions => base.Functions.Concat(_dialectFunctions);
    }
}
