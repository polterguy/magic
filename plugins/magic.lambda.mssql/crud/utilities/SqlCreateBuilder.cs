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
    public class SqlCreateBuilder : com.SqlCreateBuilder
    {
        public SqlCreateBuilder(Node node, ISignaler signaler)
            : base(node, signaler, "\"")
        { }

        protected override void GetInBetween(StringBuilder builder)
        {
            builder.Append(" output inserted.id");
        }
    }
}
