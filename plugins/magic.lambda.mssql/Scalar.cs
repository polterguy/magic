/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using magic.node;
using magic.signals.contracts;
using ut = magic.lambda.utilities;
using magic.lambda.mssql.utilities;

namespace magic.lambda.mssql
{
    [Slot(Name = "mssql.scalar")]
    public class Scalar : ISlot, IMeta
    {
        readonly ut.Stack<SqlConnection> _connections;

        public Scalar(ut.Stack<SqlConnection> connections)
        {
            _connections = connections ?? throw new ArgumentNullException(nameof(connections));
        }

        public void Signal(Node input)
        {
            Executor.Execute(input, _connections, (cmd) =>
            {
                input.Value = cmd.ExecuteScalar();
            });
        }

        public IEnumerable<Node> GetArguments()
        {
            yield return new Node(":", "*");
        }
    }
}
