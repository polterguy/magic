/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using data = System.Data.Common;
using NHibernate.Connection;

namespace magic.tests.internals
{
    internal class ConnectionProvider : DriverConnectionProvider
    {
        public data.DbConnection Connection = null;

        public override data.DbConnection GetConnection()
        {
            if (Connection == null)
                Connection = base.GetConnection();

            return Connection;
        }

        public override void CloseConnection(System.Data.Common.DbConnection conn)
        {
            /*
             * Notice, do nothing to avoid ISession.Flush from closing connection and 
             * opening another connection. We don't even call base class, since this would
             * close the connection, which would destroy our (memory based) SQLite database.
             */
        }
    }
}
