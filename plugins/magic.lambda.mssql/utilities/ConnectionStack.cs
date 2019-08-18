/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System.Linq;
using System.Data.SqlClient;
using System.Collections.Generic;
using magic.lambda.utilities;

namespace magic.lambda.mssql.utilities
{
	public class ConnectionStack
	{
        Synchronizer<List<SqlConnection>> _connections = new Synchronizer<List<SqlConnection>>(new List<SqlConnection>());

        public void Add(SqlConnection connection)
        {
            _connections.Write((x) => x.Add(connection));
        }

        public SqlConnection GetTopConnection()
        {
            return _connections.Read((x) => x.Last());
        }

        public void RemoveTopConnection()
        {
            _connections.Write((x) => x.RemoveAt(x.Count - 1));
        }
	}
}
