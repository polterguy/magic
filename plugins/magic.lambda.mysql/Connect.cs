/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Collections.Generic;
using MySql.Data.MySqlClient;
using Microsoft.Extensions.Configuration;
using magic.node;
using ut = magic.utils;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.mysql
{
	[Slot(Name = "mysql.connect")]
	public class Connect : ISlot, IMeta
	{
		readonly ISignaler _signaler;
        readonly ut.Stack<MySqlConnection> _connections;
        readonly IConfiguration _configuration;

        public Connect(ISignaler signaler, ut.Stack<MySqlConnection> connections, IConfiguration configuration)
		{
			_signaler = signaler ?? throw new ArgumentNullException(nameof(signaler));
            _connections = connections ?? throw new ArgumentNullException(nameof(connections));
            _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
        }

		public void Signal(Node input)
		{
            var connectionString = input.GetEx<string>(_signaler);

            // Checking if this is a "generic connection string".
            if (connectionString.StartsWith("[", StringComparison.InvariantCulture) &&
                connectionString.EndsWith("]", StringComparison.InvariantCulture))
            {
                var generic = _configuration["databases:mysql:generic"];
                connectionString = generic.Replace("{database}", connectionString.Substring(1, connectionString.Length - 2));
            }
            else if (!connectionString.Contains(";"))
            {
                var generic = _configuration["databases:mysql:generic"];
                connectionString = generic.Replace("{database}", connectionString);
            }

            using (var connection = new MySqlConnection(connectionString))
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
