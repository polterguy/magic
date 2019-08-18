/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Collections.Generic;
using MySql.Data.MySqlClient;
using magic.node;
using magic.signals.contracts;
using ut = magic.lambda.utilities;
using magic.lambda.mysql.utilities;

namespace magic.lambda.mysql
{
    [Slot(Name = "mysql.execute")]
    public class Execute : ISlot, IMeta
    {
        readonly ut.Stack<MySqlConnection> _connections;

        public Execute(ut.Stack<MySqlConnection> connections)
        {
            _connections = connections ?? throw new ArgumentNullException(nameof(connections));
        }

        public void Signal(Node input)
        {
            Executor.Execute(input, _connections, (cmd) =>
            {
                input.Value = cmd.ExecuteNonQuery();
            });
        }

        public IEnumerable<Node> GetArguments()
        {
            yield return new Node(":", "*");
        }
    }
}
