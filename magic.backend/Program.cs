/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using log4net;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Hosting;
using System.IO;
using System.Xml;
using System.Reflection;
using System;

namespace magic.backend
{
    public class Program
    {
        static readonly ILog _logger = LogManager.GetLogger(typeof(Program));

        public static void Main(string[] args)
        {
            var log4netConfig = new XmlDocument();
            log4netConfig.Load(File.OpenRead(string.Concat(AppDomain.CurrentDomain.BaseDirectory, "log4net.config")));

            var repo = log4net.LogManager.CreateRepository(
                Assembly.GetEntryAssembly(),
                typeof(log4net.Repository.Hierarchy.Hierarchy));

            log4net.Config.XmlConfigurator.Configure(repo, log4netConfig["log4net"]);

            _logger.Info("Starting application");

            CreateWebHostBuilder(args)
                .Build()
                .Run();
        }

        public static IWebHostBuilder CreateWebHostBuilder(string[] args) =>
            WebHost.CreateDefaultBuilder(args)
                .UseStartup<Startup>();
    }
}
