/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Reflection;
using Microsoft.Extensions.DependencyInjection;
using NHibernate;
using NHibernate.Tool.hbm2ddl;
using FluentNHibernate.Cfg;
using FluentNHibernate.Cfg.Db;
using cnf = NHibernate.Cfg;
using magic.tests.internals;

namespace magic.tests
{
    public class DbConnection : IDisposable
    {
        readonly public ISession Session;
        readonly public IServiceProvider Provider;

        public DbConnection(Action<ServiceCollection> injectServices, params Assembly[] mappings)
        {
            var services = new ServiceCollection();

            var nConfig = new cnf.Configuration();
            var factory = Fluently.Configure()
                .Database(
                    SQLiteConfiguration.Standard.ConnectionString("Data Source=:memory:;Version=3;New=True;")
                        .Provider<ConnectionProvider>())
                .Mappings((m) =>
                {
                    foreach (var idxAssembly in mappings)
                    {
                        m.FluentMappings.AddFromAssembly(idxAssembly);
                    }
                })
                .ExposeConfiguration(cfg => nConfig = cfg)
                .BuildSessionFactory();

            nConfig.Properties["connection.release_mode"] = "on_close";
            Session = factory.OpenSession();

            new SchemaExport(nConfig).Execute(false, true, false, Session.Connection, null);
            services.AddSingleton<ISession>(Session);
            services.AddSingleton<ISessionFactory>(factory);
            if (injectServices != null)
                injectServices(services);
            Provider = services.BuildServiceProvider();
        }

        #region [ -- Interface implementations -- ]

        public void Dispose()
        {
            Session.Connection.Close();
        }

        #endregion
    }
}

