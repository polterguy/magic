/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Collections.Generic;
using magic.node;
using magic.signals.contracts;

namespace magic.lambda.mysql
{
    [Slot(Name = "mysql.select")]
    public class Select : ISlot, IMeta
    {
        readonly ISignaler _signaler;
        readonly ConnectionStack _connections;

        public Select(ISignaler signaler, ConnectionStack connections)
        {
            _signaler = signaler ?? throw new ArgumentNullException(nameof(signaler));
            _connections = connections ?? throw new ArgumentNullException(nameof(connections));
        }

        public void Signal(Node input)
        {
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
