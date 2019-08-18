/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Collections.Generic;
using magic.node;
using magic.signals.contracts;
using magic.lambda.mssql.utilities;

namespace magic.lambda.mssql
{
    [Slot(Name = "mysql.scalar")]
    public class Scalar : ISlot, IMeta
    {
        readonly ConnectionStack _connections;

        public Scalar(ConnectionStack connections)
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
