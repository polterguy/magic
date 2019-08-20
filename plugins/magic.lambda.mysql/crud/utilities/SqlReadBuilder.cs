/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using System.Text;
using magic.node;
using magic.hyperlambda.utils;
using magic.signals.contracts;

namespace magic.lambda.mysql.crud.utilities
{
    public class SqlReadBuilder : SqlBuilder
    {
        public SqlReadBuilder(Node node, ISignaler signaler)
            : base(node, signaler)
        { }

        public override Node Build()
        {
            // Return value.
            var result = new Node("sql");

            // Starting build process.
            var builder = new StringBuilder();
            builder.Append("select ");

            var columns = Root.Children.Where((x) => x.Name == "columns");
            if (columns.Any() && columns.First().Children.Any())
            {
                var first = true;
                foreach (var idx in columns.First().Children)
                {
                    if (first)
                        first = false;
                    else
                        builder.Append(",");
                    builder.Append("`" + idx.Name.Replace("`", "``") + "`");
                }
            }
            else
            {
                builder.Append("*");
            }
            builder.Append(" from ");

            // Getting table name from base class.
            BuildTableName(builder);

            // Getting [where] clause.
            BuildWhere(result, builder);

            // Getting [order]
            var order = Root.Children.Where((x) => x.Name == "order");
            if (order.Any())
            {
                // Sanity checking.
                if (order.Count() > 1)
                    throw new ApplicationException($"syntax error in '{GetType().FullName}', too many [order] nodes");

                builder.Append(" order by `" + order.First().GetEx<string>(Signaler).Replace("`", "``") + "`");
                var direction = Root.Children.Where((x) => x.Name == "direction");
                if (direction.Any())
                {
                    // Sanity checking.
                    if (direction.Count() > 1)
                        throw new ApplicationException($"syntax error in '{GetType().FullName}', too many [direction] nodes");

                    var dir = direction.First().GetEx<string>(Signaler);
                    if (dir != "asc" && dir != "desc")
                        throw new ArgumentException($"I don't know how to sort according to the '{dir}' [direction], only 'asc' and 'desc'");

                    builder.Append(" " + dir);
                }
            }

            var limit = Root.Children.Where((x) => x.Name == "limit");
            if (limit.Any())
            {
                // Sanity checking.
                if (limit.Count() > 1)
                    throw new ApplicationException($"syntax error in '{GetType().FullName}', too many [limit] nodes");

                builder.Append(" limit " + limit.First().GetEx<long>(Signaler));
            }

            var offset = Root.Children.Where((x) => x.Name == "offset");
            if (offset.Any())
            {
                // Sanity checking.
                if (offset.Count() > 1)
                    throw new ApplicationException($"syntax error in '{GetType().FullName}', too many [offset] nodes");

                builder.Append(" offset " + offset.First().GetEx<long>(Signaler));
            }

            // Returning result to caller.
            result.Value = builder.ToString();
            return result;
        }
    }
}
