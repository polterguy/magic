/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Text;
using magic.node;
using magic.node.extensions;
using Build = magic.data.common.builders;

namespace magic.lambda.mssql.crud.builders
{
    /// <summary>
    /// Builder for creating a read type of MS SQL Server statement,
    /// </summary>
    public class SqlReadBuilder : Build.SqlReadBuilder
    {
        /// <summary>
        /// Creates en instance of your type.
        /// </summary>
        /// <param name="node">Arguments to create your SQL from.</param>
        public SqlReadBuilder(Node node)
            : base(node, "\"")
        { }

        /// <summary>
        /// Appends the "tail" parts of your SQL into the specified builder.
        /// </summary>
        /// <param name="builder">Builder where to put the tail.</param>
        protected override void AppendTail(StringBuilder builder)
        {
            // Order counts!
            AppendGroupBy(builder);
            AppendOrderBy(builder);

            var offsetNodes = Root.Children.Where(x => x.Name == "offset");
            if (offsetNodes.Any())
            {
                // Sanity checking.
                if (offsetNodes.Count() > 1)
                    throw new HyperlambdaException($"syntax error in '{GetType().FullName}', too many [offset] nodes");

                var offsetValue = offsetNodes.First().GetEx<long>();
                builder.Append(" offset " + offsetValue + " rows");
            }
            else
            {
                builder.Append(" offset 0 rows");
            }

            // Getting [limit].
            var limitNodes = Root.Children.Where(x => x.Name == "limit");
            if (limitNodes.Any())
            {
                // Sanity checking.
                if (limitNodes.Count() > 1)
                    throw new HyperlambdaException($"syntax error in '{GetType().FullName}', too many [limit] nodes");

                var limitValue = limitNodes.First().GetEx<long>();
                if (limitValue > -1)
                    builder.Append(" fetch next " + limitValue + " rows only");
            }
            else
            {
                // Defaulting to 25 records, unless [limit] was explicitly given.
                builder.Append(" fetch next 25 rows only");
            }
        }

        /// <summary>
        /// Appends the default order by parts of the SQL statement.
        /// </summary>
        /// <param name="builder">Where to put the SQL.</param>
        protected override void AppendDefaultOrderBy(StringBuilder builder)
        {
            builder.Append(" order by (select null)");
        }
    }
}
