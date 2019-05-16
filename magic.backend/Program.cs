/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.IO;
using System.Xml;
using System.Reflection;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Hosting;
using log4net;

namespace magic.backend
{
    public class Program
    {
        public static void Main(string[] args)
        {
            #region [ -- Magic parts -- ]

            var log4netConfig = new XmlDocument();
            log4netConfig.Load(File.OpenRead(string.Concat(AppDomain.CurrentDomain.BaseDirectory, "log4net.config")));

            var repo = LogManager.CreateRepository(
                Assembly.GetEntryAssembly(),
                typeof(log4net.Repository.Hierarchy.Hierarchy));

            log4net.Config.XmlConfigurator.Configure(repo, log4netConfig["log4net"]);

            ILog logger = LogManager.GetLogger(typeof(Program));
            logger.Info("Starting application");

            #endregion

            CreateWebHostBuilder(args)
                .Build()
                .Run();
        }

        public static IWebHostBuilder CreateWebHostBuilder(string[] args) =>
            WebHost.CreateDefaultBuilder(args)
                .UseStartup<Startup>();
    }
}
