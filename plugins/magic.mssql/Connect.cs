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
    [Slot(Name = "mssql.connect")]
    public class Connect : ISlot, IMeta
    {
        readonly ISignaler _signaler;

        public Connect(ISignaler signaler)
        {
            _signaler = signaler ?? throw new ArgumentNullException(nameof(signaler));
        }

        public void Signal(Node input)
        {
            using (var connection = new SqlConnection(input.Get<string>()))
            {
                // TODO: Make it somehow globally accessible on a per request/thread basis.
                // This is necessary to support opening a connection in one file, for then to use the connection
                // in another file, etc ...
                // Use a stack, such that any select/scalar/etc method will always use the last opened connection.
                connection.Open();
                input.Value = connection;
                _signaler.Signal("eval", input);
                input.Value = null;
            }
        }

        public IEnumerable<Node> GetArguments()
        {
            yield return new Node(":", "*");
            yield return new Node("*", "*");
        }
    }
}
