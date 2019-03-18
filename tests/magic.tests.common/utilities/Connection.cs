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
    public class Connection : IDisposable
    {
        // Helper to make sure connection is not closed as ISession is flushed.
        internal class ConnectionProvider : DriverConnectionProvider
        {
            public DbConnection Connection = null;

            public override DbConnection GetConnection()
            {
                // Notice, we only open connection once for each instance, to avoid having ISession.Flush closing connection and destroying the database.
                if (Connection == null)
                    Connection = base.GetConnection();
                return Connection;
            }

            public override void CloseConnection(DbConnection conn) { /* Notice, do nothing to avoid ISession.Flush from closing connection and opening another connection */ }
        }

        readonly public ISession Session;
        readonly public IKernel Kernel;

        public Connection(params Assembly[] assemblyContainingMapping)
        {
            Kernel = new StandardKernel();
            Kernel.Bind<IAdapter>().To<Adapter>();
            var nConfig = new cnf.Configuration();
            var factory = Fluently.Configure()
                .Database(SQLiteConfiguration.Standard.ConnectionString("Data Source=:memory:;Version=3;New=True;").Provider<ConnectionProvider>())
                .Mappings((m) =>
                {
                    foreach (var idxAssembly in assemblyContainingMapping)
                    {
                        m.FluentMappings.AddFromAssembly(idxAssembly);
                    }
                })
                .ExposeConfiguration(cfg => nConfig = cfg)
                .BuildSessionFactory();
            nConfig.Properties["connection.release_mode"] = "on_close";
            Session = factory.OpenSession();

            new SchemaExport(nConfig).Execute(true, true, false, Session.Connection, null);
            Kernel.Bind<ISession>().ToConstant(Session);
        }

        public void Dispose()
        {
            Session.Connection.Close();
        }
    }
}