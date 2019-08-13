/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Collections.Generic;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using magic.node;
using magic.common.contracts;
using magic.signals.contracts;

namespace magic.console
{
    class Program
    {
        static bool _hasLoaded = false;

        static void Main(string[] args)
        {
            var services = Initialize();
            var signaler = services.GetService(typeof(ISignaler)) as ISignaler;
            foreach (var idx in args)
            {
                if (File.Exists(idx))
                    RunFile(signaler, idx);
                else
                    RunFolder(signaler, idx);
            }
            Console.WriteLine();
            Console.WriteLine();
            Console.Write("Press enter to exit application");
            Console.ReadLine();
        }

        #region [ -- Private helper methods -- ]

        private static void RunFolder(ISignaler signaler, string folder)
        {
            foreach (var idxFile in Directory.GetFiles(folder))
            {
                RunFile(signaler, idxFile);
            }
        }

        private static void RunFile(ISignaler signaler, string filename)
        {
            Console.WriteLine();
            Console.WriteLine("*****************************************************");
            Console.WriteLine($" Executing file '{filename}'");
            Console.WriteLine("*****************************************************");
            Console.WriteLine();
            using (var file = File.OpenText(filename))
            {
                var hl = file.ReadToEnd();
                var node = new Node("", hl);
                signaler.Signal("lambda", node);
                signaler.Signal("eval", node);
            }
            Console.WriteLine("*****************************************************");
            Console.WriteLine();
        }

        static IServiceProvider Initialize()
        {
            LoadAssemblies();

            var configuration = new ConfigurationBuilder().Build();
            var kernel = new ServiceCollection();
            kernel.AddTransient<IConfiguration>((svc) => configuration);
            foreach (var idx in InstantiateAllTypes<IConfigureServices>())
            {
                idx.Configure(kernel, configuration);
            }
            var provider = kernel.BuildServiceProvider();
            return provider;
        }

        static IEnumerable<T> InstantiateAllTypes<T>() where T : class
        {
            var type = typeof(T);
            var types = AppDomain.CurrentDomain.GetAssemblies()
                .SelectMany(s => s.GetTypes())
                .Where(p => type.IsAssignableFrom(p) && !p.IsInterface && !p.IsAbstract);

            foreach (var idx in types)
            {
                var instance = Activator.CreateInstance(idx) as T;
                yield return instance;
            }
        }

        static void LoadAssemblies()
        {
            if (_hasLoaded)
                return;

            var assemblyPaths = AppDomain.CurrentDomain.GetAssemblies()
                .Where(x => !x.IsDynamic)
                .Select(x => x.Location);
            var loadedPaths = Directory.GetFiles(AppDomain.CurrentDomain.BaseDirectory, "*.dll");
            var unloadedAssemblies = loadedPaths
                .Where(r => !assemblyPaths.Contains(r, StringComparer.InvariantCultureIgnoreCase));
            foreach (var idx in unloadedAssemblies)
            {
                AppDomain.CurrentDomain.Load(AssemblyName.GetAssemblyName(idx));
            }
            _hasLoaded = true;
        }

        #endregion
    }
}
