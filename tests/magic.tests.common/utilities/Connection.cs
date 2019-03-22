/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Reflection;
using Mapster;
using Ninject;
using NHibernate;
using NHibernate.Tool.hbm2ddl;
using FluentNHibernate.Cfg;
using FluentNHibernate.Cfg.Db;
using cnf = NHibernate.Cfg;

namespace magic.tests.common.utilities
{
    public class Connection : IDisposable
    {
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