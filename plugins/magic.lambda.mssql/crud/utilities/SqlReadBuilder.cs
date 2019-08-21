/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using System.Text;
using magic.node;
using com = magic.data.common;
using magic.signals.contracts;
using magic.hyperlambda.utils;

namespace magic.lambda.mssql.crud.utilities
{
    public class SqlReadBuilder : com.SqlReadBuilder
    {
        public SqlReadBuilder(Node node, ISignaler signaler)
            : base(node, signaler, "\"")
        { }


        protected override void GetTail(StringBuilder builder)
        {
            // Getting [order].
            GetOrderBy(builder);

            var offsetNodes = Root.Children.Where((x) => x.Name == "offset");
            if (offsetNodes.Any())
            {
                // Sanity checking.
                if (offsetNodes.Count() > 1)
                    throw new ApplicationException($"syntax error in '{GetType().FullName}', too many [offset] nodes");

                var offsetValue = offsetNodes.First().GetEx<long>(Signaler);
                builder.Append(" offset " + offsetValue + " rows");
            }

            // Getting [limit].
            var limitNodes = Root.Children.Where((x) => x.Name == "limit");
            if (limitNodes.Any())
            {
                // Sanity checking.
                if (limitNodes.Count() > 1)
                    throw new ApplicationException($"syntax error in '{GetType().FullName}', too many [limit] nodes");

                var limitValue = limitNodes.First().GetEx<long>(Signaler);
                builder.Append(" fetch next " + limitValue + " rows only");
            }
        }
    }
}
