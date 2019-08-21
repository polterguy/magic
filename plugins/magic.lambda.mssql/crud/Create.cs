/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using System.Data.SqlClient;
using System.Collections.Generic;
using magic.node;
using magic.signals.contracts;
using ut = magic.lambda.utilities;
using magic.lambda.mssql.utilities;
using magic.lambda.mssql.crud.utilities;

namespace magic.lambda.mssql.crud
{
    [Slot(Name = "mssql.create")]
    public class Create : ISlot, IMeta
    {
        readonly ut.Stack<SqlConnection> _connections;
        readonly ISignaler _signaler;

        public Create(ut.Stack<SqlConnection> connections, ISignaler signaler)
        {
            _connections = connections ?? throw new ArgumentNullException(nameof(connections));
            _signaler = signaler ?? throw new ArgumentNullException(nameof(signaler));
        }

        public void Signal(Node input)
        {
            var builder = new SqlCreateBuilder(input, _signaler);
            var sqlNode = builder.Build();

            // Checking if this is a "build only" invocation.
            if (builder.IsGenerateOnly)
            {
                input.Value = sqlNode.Value;
                input.Clear();
                input.AddRange(sqlNode.Children.ToList());
                return;
            }

            // Executing SQL, now parametrized.
            Executor.Execute(sqlNode, _connections, _signaler, (cmd) =>
            {
                // Notice, create SQL returns last inserted ID!
                input.Value = cmd.ExecuteScalar();
                input.Clear();
            });
        }

        public IEnumerable<Node> GetArguments()
        {
            yield return new Node(":", "*");
            yield return new Node("connection", "*");
            yield return new Node("table", "*");
            yield return new Node("values");
        }
    }
}
