/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System.Linq;
using System.Collections.Generic;
using MySql.Data.MySqlClient;
using magic.lambda.utilities;

namespace magic.lambda.mysql.utilities
{
	public class ConnectionStack
	{
        Synchronizer<List<MySqlConnection>> _connections = new Synchronizer<List<MySqlConnection>>(new List<MySqlConnection>());

        public void Add(MySqlConnection connection)
        {
            _connections.Write((x) => x.Add(connection));
        }

        public MySqlConnection GetTopConnection()
        {
            return _connections.Read((x) => x.Last());
        }

        public void RemoveTopConnection()
        {
            _connections.Write((x) => x.RemoveAt(x.Count - 1));
        }
	}
}
