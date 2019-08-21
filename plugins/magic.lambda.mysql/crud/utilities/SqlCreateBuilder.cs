/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System.Text;
using magic.node;
using com = magic.data.common;
using magic.signals.contracts;

namespace magic.lambda.mysql.crud.utilities
{
    public class SqlCreateBuilder : com.SqlCreateBuilder
    {
        public SqlCreateBuilder(Node node, ISignaler signaler)
            : base(node, signaler, "`")
        { }

        protected override void GetTail(StringBuilder builder)
        {
            builder.Append("; select last_insert_id();");
        }
    }
}
