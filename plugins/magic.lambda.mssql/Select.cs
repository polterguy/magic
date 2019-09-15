/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Data.SqlClient;
using magic.node;
using magic.signals.contracts;
using ut = magic.utils;
using magic.lambda.mssql.utilities;

namespace magic.lambda.mssql
{
    [Slot(Name = "mssql.select")]
    public class Select : ISlot
    {
        readonly ut.Stack<SqlConnection> _connections;
        readonly ISignaler _signaler;

        public Select(ut.Stack<SqlConnection> connections, ISignaler signaler)
        {
            _connections = connections ?? throw new ArgumentNullException(nameof(connections));
            _signaler = signaler ?? throw new ArgumentNullException(nameof(signaler));
        }

        public void Signal(Node input)
        {
            Executor.Execute(input, _connections, _signaler, (cmd) =>
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
    }
}
