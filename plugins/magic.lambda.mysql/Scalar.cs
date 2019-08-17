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
    [Slot(Name = "mysql.scalar")]
    public class Scalar : ISlot, IMeta
    {
        readonly ISignaler _signaler;
        readonly ConnectionStack _connections;

        public Scalar(ISignaler signaler, ConnectionStack connections)
        {
            _signaler = signaler ?? throw new ArgumentNullException(nameof(signaler));
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
