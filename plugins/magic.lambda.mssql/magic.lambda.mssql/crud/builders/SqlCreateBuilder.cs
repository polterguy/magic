/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Text;
using magic.node;
using Build = magic.data.common.builders;

namespace magic.lambda.mssql.crud.builders
{
    /// <summary>
    /// Create SQL type of builder for MS SQL Server types of statements.
    /// </summary>
    public class SqlCreateBuilder : Build.SqlCreateBuilder
    {
        /// <summary>
        /// Creates a new instance of your class.
        /// </summary>
        /// <param name="node">Arguments used to semantically build your SQL.</param>
        public SqlCreateBuilder(Node node)
            : base(node, "\"")
        { }

        /// <summary>
        /// Makes sure we can select the scope identity for inserted record.
        /// </summary>
        /// <param name="builder">Where to put our SQL.</param>
        protected override void AppendTail(StringBuilder builder)
        {
            builder.Append("; select scope_identity();");
        }
    }
}
