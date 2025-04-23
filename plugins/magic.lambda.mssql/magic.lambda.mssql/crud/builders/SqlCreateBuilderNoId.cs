/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using magic.node;
using Build = magic.data.common.builders;

namespace magic.lambda.mssql.crud.builders
{
    /// <summary>
    /// Create SQL type of builder for MS SQL Server types of statements,
    /// that does not return the generated record's ID.
    ///
    /// This is useful for times when you don't have auto_increment or generated
    /// IDs on your table.
    /// </summary>
    public class SqlCreateBuilderNoId : Build.SqlCreateBuilder
    {
        /// <summary>
        /// Creates a new instance of your class.
        /// </summary>
        /// <param name="node">Arguments used to semantically build your SQL.</param>
        public SqlCreateBuilderNoId(Node node)
            : base(node, "\"")
        { }
    }
}
