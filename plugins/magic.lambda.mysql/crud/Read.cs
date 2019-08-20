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

namespace magic.lambda.mysql.crud
{
    [Slot(Name = "mysql.read")]
    public class Read : ISlot, IMeta
    {
        readonly ut.Stack<MySqlConnection> _connections;
        readonly ISignaler _signaler;

        public Read(ut.Stack<MySqlConnection> connections, ISignaler signaler)
        {
            _connections = connections ?? throw new ArgumentNullException(nameof(connections));
            _signaler = signaler ?? throw new ArgumentNullException(nameof(signaler));
        }

        public void Signal(Node input)
        {
            Executor.ExecuteCrud(
                input,
                _connections,
                _signaler,
                (n, s) => Executor.CreateSelect(n, s),
                (cmd, n) =>
                {
                    using (var reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            var rowNode = new Node();
                            for (var idxCol = 0; idxCol < reader.FieldCount; idxCol++)
                            {
                                var colNode = new Node(reader.GetName(idxCol), reader[idxCol]);
                                rowNode.Add(colNode);
                            }
                            input.Add(rowNode);
                        }
                    }
                });
        }

        public IEnumerable<Node> GetArguments()
        {
            yield return new Node(":", "*");
            yield return new Node("connection", "*");
            yield return new Node("table", "*");
            yield return new Node("columns");
            yield return new Node("where");
            yield return new Node("limit", "*");
            yield return new Node("offset", "*");
            yield return new Node("order", "*");
        }
    }
}
