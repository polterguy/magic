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
using Microsoft.Extensions.DependencyInjection;

namespace magic.backend.init
{
    public static class InitializeDatabase
    {
        private class Database
        {
            public string Type { get; set; }

            public string Connection { get; set; }
        }

        public static void Initialize(IServiceCollection services, IConfiguration configuration)
        {
            var type = typeof(IMappingProvider);
            var assemblies = AppDomain.CurrentDomain.GetAssemblies()
                .Where(asm => asm.GetTypes()
                    .Any(x => type.IsAssignableFrom(x) && !x.IsInterface && !x.FullName.StartsWith("FluentNHibernate")));

            var factory = CreateSessionFactory(configuration, assemblies);

            services.AddScoped<ISession>((svc) => factory.OpenSession());

            // Threads might need a session that's not bound to the scope,
            // hence we also expose the Session Factory.
            services.AddSingleton<ISessionFactory>(factory);
        }

        static ISessionFactory CreateSessionFactory(
            IConfiguration configuration, 
            IEnumerable<Assembly> assemblies)
        {
            var database = new Database();
            configuration.GetSection("database").Bind(database);
            var db = Fluently.Configure();
            switch (database.Type)
            {
                case "MSSQL":
                    // Notice, version 2012
                    db = db.Database(MsSqlConfiguration.MsSql2012.ConnectionString(database.Connection));
                    break;
                case "MySQL":
                    db = db.Database(MySQLConfiguration.Standard.ConnectionString(database.Connection));
                    break;
                case "SQLIte":
                    db = db.Database(SQLiteConfiguration.Standard.ConnectionString(database.Connection));
                    break;

                // Specific versions of MS SQL
                case "MsSql7":
                    db = db.Database(MsSqlConfiguration.MsSql7.ConnectionString(database.Connection));
                    break;
                case "MsSql2008":
                    db = db.Database(MsSqlConfiguration.MsSql2008.ConnectionString(database.Connection));
                    break;
                case "MsSql2005":
                    db = db.Database(MsSqlConfiguration.MsSql2005.ConnectionString(database.Connection));
                    break;
                case "MsSql2000":
                    db = db.Database(MsSqlConfiguration.MsSql2000.ConnectionString(database.Connection));
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
