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

namespace magic.lambda.mysql
{
    [Slot(Name = "mysql.insert")]
    public class Insert : ISlot, IMeta
    {
        readonly ut.Stack<MySqlConnection> _connections;

        public Insert(ut.Stack<MySqlConnection> connections)
        {
            _connections = connections ?? throw new ArgumentNullException(nameof(connections));
        }

        public void Signal(Node input)
        {
            if (input.Children.Any((x) =>
            {
                return x.Name != "connection" &&
                    x.Name != "table" &&
                    x.Name != "where" &&
                    x.Name != "values";
            }))
                throw new ArgumentException($"Illegal argument given to [mysql.insert]");

            // Creating parametrized SQL node.
            var execute = Executor.CreateInsert(input);

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
                input.Value = cmd.ExecuteScalar();
                input.Clear();
            });
        }

        public IEnumerable<Node> GetArguments()
        {
            yield return new Node(":", "*");
        }
    }
}
