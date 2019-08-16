/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Data.SqlClient;
using System.Collections.Generic;
using magic.node;
using magic.signals.contracts;

namespace magic.lambda
{
    [Slot(Name = "mssql.select")]
    public class Select : ISlot, IMeta
    {
        readonly ISignaler _signaler;

        public Select(ISignaler signaler)
        {
            _signaler = signaler ?? throw new ArgumentNullException(nameof(signaler));
        }

        public void Signal(Node input)
        {
            // Retrieving connection.
            var connectionNode = input.Parent;
            while (connectionNode.Name != "mssql.connect")
                connectionNode = connectionNode.Parent;

            var connection = connectionNode.Value as SqlConnection;
            using (var cmd = new SqlCommand(input.Get<string>(), connection))
            {
                foreach (var idxPar in input.Children)
                {
                    cmd.Parameters.AddWithValue(idxPar.Name, idxPar.Value);
                }
                using (var reader = cmd.ExecuteReader())
                {
                    while(reader.Read())
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
            }
            input.Value = null;
        }

        public IEnumerable<Node> GetArguments()
        {
            yield return new Node(":", "*");
            yield return new Node("*", "*");
        }
    }
}
