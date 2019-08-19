/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using System.Collections.Generic;
using MySql.Data.MySqlClient;
using magic.node;
using magic.signals.contracts;
using ut = magic.lambda.utilities;
using magic.lambda.mysql.utilities;

namespace magic.lambda.mysql.crud
{
    [Slot(Name = "mysql.select")]
    public class Select : ISlot, IMeta
    {
        readonly ut.Stack<MySqlConnection> _connections;

        public Select(ut.Stack<MySqlConnection> connections)
        {
            _connections = connections ?? throw new ArgumentNullException(nameof(connections));
        }

        public void Signal(Node input)
        {
            if (input.Children.Any((x) =>
            {
                return x.Name != "connection" &&
                    x.Name != "table" &&
                    x.Name != "columns" &&
                    x.Name != "where" &&
                    x.Name != "limit" &&
                    x.Name != "offset" &&
                    x.Name != "order";
            }))
                throw new ArgumentException($"Illegal argument given to [mysql.select]");

            // Creating parametrized SQL node.
            var execute = Executor.CreateSelect(input);

            // Checking if caller is only interested in SQL text.
            var onlySql = !input.Children.Any((x) => x.Name == "connection");

            // Massaging node to get parameters correctly.
            input.Value = execute.Value;
            input.Clear();
            input.AddRange(execute.Children.ToList());
            if (onlySql)
                return;

            // Executing SQL.
            Executor.Execute(input, _connections, (cmd) =>
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
        }
    }
}
