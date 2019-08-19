/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Collections.Generic;
using MySql.Data.MySqlClient;
using magic.node;
using magic.signals.contracts;
using magic.hyperlambda.utils;
using ut = magic.lambda.utilities;

namespace magic.lambda.mysql
{
	[Slot(Name = "mysql.connect")]
	public class Connect : ISlot, IMeta
	{
		readonly ISignaler _signaler;
        readonly ut.Stack<MySqlConnection> _connections;

        public Connect(ISignaler signaler, ut.Stack<MySqlConnection> connections)
		{
			_signaler = signaler ?? throw new ArgumentNullException(nameof(signaler));
            _connections = connections ?? throw new ArgumentNullException(nameof(connections));
        }

		public void Signal(Node input)
		{
			using (var connection = new MySqlConnection(input.GetEx<string>(_signaler)))
			{
				connection.Open();
                _connections.Push(connection);
                try
                {
                    _signaler.Signal("eval", input);
                }
                finally
                {
                    _connections.Pop();
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
