/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using magic.node;
using com = magic.data.common;
using magic.signals.contracts;

namespace magic.lambda.mysql.crud.builders
{
    public class SqlReadBuilder : com.SqlReadBuilder
    {
        public SqlReadBuilder(Node node, ISignaler signaler)
            : base(node, signaler, "`")
        { }
    }
}
