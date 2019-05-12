/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.IO;
using System.Linq;
using System.Reflection;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using magic.common.contracts;
using System.Collections.Generic;

namespace magic.backend.init
{
    public class Configurator
    {
        static bool _hasLoaded = false;

        public static void ConfigureServices(
            IServiceCollection services,
            IConfiguration configuration)
        {
            foreach (var idx in InstantiateAllTypes<IConfigureServices>())
            {
                idx.Configure(services, configuration);
            }
        }

        public static void ConfigureApplication(
            IApplicationBuilder app,
            IConfiguration configuration)
        {
            foreach (var idx in InstantiateAllTypes<IConfigureApplication>())
            {
                idx.Configure(app, configuration);
            }
        }

        public static void InitializeStartups(
            IServiceProvider provider,
            IConfiguration configuration)
        {
            foreach (var idx in InstantiateAllTypes<IStartup>())
            {
                idx.Initialize(provider, configuration);
            }
        }

        #region [ -- Private methods -- ]

        static IEnumerable<T> InstantiateAllTypes<T>() where T : class
        {
            LoadAssemblies();

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