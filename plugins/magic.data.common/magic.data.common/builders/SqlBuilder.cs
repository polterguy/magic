/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Text;
using magic.node;
using magic.node.extensions;

namespace magic.data.common.builders
{
    /// <summary>
    /// Common base class for SQL generators, allowing you to generate SQL from a lambda object.
    /// </summary>
    public abstract class SqlBuilder
    {
        /// <summary>
        /// Creates a new SQL builder.
        /// </summary>
        /// <param name="node">Root node to generate your SQL from.</param>
        /// <param name="escapeChar">Escape character to use for escaping table names etc.</param>
        /// <param name="kind">Kind of date to convert date to if date is specified in another kind</param>
        protected SqlBuilder(Node node, string escapeChar, DateTimeKind kind)
        {
            Root = node ?? throw new ArgumentNullException(nameof(node));
            EscapeChar = escapeChar ?? throw new ArgumentNullException(nameof(escapeChar));
            Kind = kind;
        }

        /// <summary>
        /// Builds your SQL statement, and returns a structured SQL statement, plus any parameters.
        /// </summary>
        /// <returns>Node containing SQL as root node, and parameters as children.</returns>
        public abstract Node Build();

        /// <summary>
        /// Signals to inherited class if this is a pure generate job, or if it should also evaluate the SQL command.
        /// </summary>
        public bool IsGenerateOnly => Root.Children.FirstOrDefault(x => x.Name == "generate")?.Get<bool>() ?? false;

        /// <summary>
        /// Returns the escape character, which is typically " or ` character
        /// </summary>
        protected string EscapeChar { get; private set; }

        /// <summary>
        /// Returns the escape character, which is typically " or ` character
        /// </summary>
        protected DateTimeKind Kind { get; private set; }

        /// <summary>
        /// Generic helper method to use an existing SQL builder and return it to caller as an executable SQL.
        /// </summary>
        /// <param name="builder">Actual builder to use.</param>
        /// <returns>If execution of node should be done, the method will return the node to execute,
        /// otherwise null will be returned, and the builder's root node will contain SQL and arguments
        /// as children.</returns>
        public static Node Parse(SqlBuilder builder)
        {
            /*
             * Retrieving all explicitly added arguments.
             */
            var explicitArgs = builder
                .Root
                .Children
                .Where(x => x.Name.StartsWith("@", StringComparison.InvariantCulture)).ToList();
            var sqlNode = builder.Build();

            // Adding all explicitly added arguments.
            sqlNode.AddRange(explicitArgs);

            // Checking if this is a "build only" invocation.
            if (builder.IsGenerateOnly)
            {
                builder.Root.Value = sqlNode.Value;
                builder.Root.Clear();
                builder.Root.AddRange(sqlNode.Children.ToList());
                return null ;
            }
            return sqlNode;
        }

        #region [ -- Protected helper methods and properties -- ]

        /// <summary>
        /// Root node from which the SQL generator is being evaluated towards.
        /// </summary>
        protected Node Root { get; private set; }

        /// <summary>
        /// Securely adds the table name into the specified builder.
        /// </summary>
        /// <param name="builder">StringBuilder to append the table name into.</param>
        protected virtual void AppendTableName(StringBuilder builder)
        {
            // Retrieving actual table name from [table] node.
            var tableName = Root.Children.FirstOrDefault(x => x.Name == "table")?.GetEx<string>();
            if (tableName == null)
                throw new HyperlambdaException($"No [table] supplied to '{GetType().FullName}'");
            builder.Append(EscapeTypeName(tableName));
        }

        /// <summary>
        /// Escapes a column name, and returns to caller.
        /// </summary>
        /// <param name="column">Name of column as supplied by lambda object.</param>
        /// <returns>The escaped column's name.</returns>
        protected virtual string EscapeColumnName(string column)
        {
            return EscapeChar + 
                column.Replace(EscapeChar, EscapeChar + EscapeChar) +
                EscapeChar;
        }

        /// <summary>
        /// Escapes a single table or column name, and appends to builder.
        /// </summary>
        /// <param name="typeName">Actual typename.</param>
        /// <returns>The escaped typename.</returns>
        protected virtual string EscapeTypeName(string typeName)
        {
            return string.Join(".", typeName.Split('.').Select(x => EscapeColumnName(x)));
        }

        #endregion
    }
}
