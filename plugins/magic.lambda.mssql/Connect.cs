/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Data.SqlClient;
using System.Collections.Generic;
using magic.node;
using magic.signals.contracts;

namespace magic.lambda.mssql
{
	[Slot(Name = "mssql.connect")]
	public class Connect : ISlot, IMeta
	{
		readonly ISignaler _signaler;
        readonly ConnectionStack _connections;

        public Connect(ISignaler signaler, ConnectionStack connections)
		{
			_signaler = signaler ?? throw new ArgumentNullException(nameof(signaler));
            _connections = connections ?? throw new ArgumentNullException(nameof(connections));
        }

		public void Signal(Node input)
		{
			using (var connection = new SqlConnection(input.Get<string>()))
			{
				connection.Open();
                _connections.Add(connection);
                try
                {
                    _signaler.Signal("eval", input);
                }
                finally
                {
                    _connections.RemoveTopConnection();
                }
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
