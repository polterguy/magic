/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Data.Common;
using Ninject;
using System.Reflection;
using NHibernate;
using NHibernate.Connection;
using NHibernate.Tool.hbm2ddl;
using cnf = NHibernate.Cfg;
using FluentNHibernate.Cfg;
using FluentNHibernate.Cfg.Db;
using Mapster;

namespace magic.tests.common.utilities
{
    internal class ConnectionProvider : DriverConnectionProvider
    {
        public DbConnection Connection = null;

        public override DbConnection GetConnection()
        {
            if (Connection == null)
                Connection = base.GetConnection();
            return Connection;
        }

        public override void CloseConnection(DbConnection conn)
        {
            /*
             * Notice, do nothing to avoid ISession.Flush from closing connection and 
             * opening another connection. We don't even call base class, since this would
             * close the connection, which would destroy our (memory based) SQLite database.
             */
        }
    }
}