/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using magic.node;
using Build = magic.data.common.builders;

namespace magic.lambda.mssql.crud.builders
{
    /// <summary>
    /// Builder to create an update type of MS SQL Server statement.
    /// </summary>
    public class SqlUpdateBuilder : Build.SqlUpdateBuilder
    {
        /// <summary>
        /// Creates an instance of your type.
        /// </summary>
        /// <param name="node">Arguments to create your statement from.</param>
        public SqlUpdateBuilder(Node node)
            : base(node, "\"")
        { }
    }
}
