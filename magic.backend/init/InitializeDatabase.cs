/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using System.Reflection;
using System.Configuration;
using System.Collections.Generic;
using Microsoft.Extensions.Configuration;
using NHibernate;
using NHibernate.Tool.hbm2ddl;
using FluentNHibernate;
using FluentNHibernate.Cfg;
using FluentNHibernate.Cfg.Db;
using Ninject;
using Ninject.Activation;

namespace magic.backend.init
{
    public static class InitializeDatabase
    {
        private class Database
        {
            public string Type { get; set; }

            public string Connection { get; set; }
        }

        public static void Initialize(IKernel kernel, IConfiguration configuration, Func<IContext, object> scopeRequest)
        {
            var type = typeof(IMappingProvider);
            var assemblies = AppDomain.CurrentDomain.GetAssemblies()
                .Where(asm => asm.GetTypes()
                    .Any(x => type.IsAssignableFrom(x) && !x.IsInterface && !x.FullName.StartsWith("FluentNHibernate")));

            var factory = CreateSessionFactory(configuration, assemblies);
            kernel.Bind<ISession>()
                .ToMethod((ctx) => factory.OpenSession())
                .InScope(scopeRequest)
                .OnDeactivation(x => x.Flush());
        }

        static ISessionFactory CreateSessionFactory(
            IConfiguration configuration, 
            IEnumerable<Assembly> assemblies)
        {
            var database = new Database();
            configuration.GetSection("database").Bind(database);
            FluentConfiguration db = null;
            switch (database.Type)
            {
                case "MSSQL":
                    // Notice, version 2012
                    db = Fluently.Configure()
                        .Database(MsSqlConfiguration.MsSql2012.ConnectionString(database.Connection));
                    break;
                case "MySQL":
                    db = Fluently.Configure()
                        .Database(MySQLConfiguration.Standard.ConnectionString(database.Connection));
                    break;
                case "SQLIte":
                    db = Fluently.Configure()
                        .Database(SQLiteConfiguration.Standard.ConnectionString(database.Connection));
                    break;

                // Specific versions of MS SQL
                case "MsSql7":
                    db = Fluently.Configure()
                        .Database(MsSqlConfiguration.MsSql7.ConnectionString(database.Connection));
                    break;
                case "MsSql2008":
                    db = Fluently.Configure()
                        .Database(MsSqlConfiguration.MsSql2008.ConnectionString(database.Connection));
                    break;
                case "MsSql2005":
                    db = Fluently.Configure()
                        .Database(MsSqlConfiguration.MsSql2005.ConnectionString(database.Connection));
                    break;
                case "MsSql2000":
                    db = Fluently.Configure()
                        .Database(MsSqlConfiguration.MsSql2000.ConnectionString(database.Connection));
                    break;
                default:
                    throw new ConfigurationErrorsException($"The database type of '{database.Type}' is unsupported.");
            }
            return db.Mappings((m) =>
            {
                foreach (var idxAsm in assemblies)
                {
                    m.FluentMappings.AddFromAssembly(idxAsm);
                }
            }).ExposeConfiguration(cfg => new SchemaUpdate(cfg).Execute(true, true)).BuildSessionFactory();
            // WARNING: The above line of code will automatically generate your database schema. This is probably NOT something you want in a production environment!

            /*
             * The above "ExposeConfiguration(cfg => new SchemaUpdate(cfg).Execute(true, true))" code will automatically create your database schema.
             * In a production environment, you would probably not want your code to automatically do this, since it modifies your database schema,
             * and might have dangerous side-effects if not done correctly.
             * 
             * NOTICE!
             * If you build the project in "Release" configuration, the database schema will NOT be automatically modified!
             */
        }
    }
}
