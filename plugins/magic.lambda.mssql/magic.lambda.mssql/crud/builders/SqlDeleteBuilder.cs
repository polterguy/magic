/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using magic.node;
using Build = magic.data.common.builders;

namespace magic.lambda.mssql.crud.builders
{
    /// <summary>
    /// Builder for creating a delete type of MS SQL Server statement.
    /// </summary>
    public class SqlDeleteBuilder : Build.SqlDeleteBuilder
    {
        /// <summary>
        /// Creates an instance of your type.
        /// </summary>
        /// <param name="node">Arguments to build your SQL from.</param>
        public SqlDeleteBuilder(Node node)
            : base(node, "\"")
        { }
    }
}
