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
using Ninject;
using magic.common.contracts;

namespace magic.backend.init
{
    public class InitializeServices
    {
        static bool _hasLoaded = false;

        public static void ConfigureServices(IServiceCollection services, IConfiguration configuration)
        {
            LoadAssemblies();

            var type = typeof(IConfigureServices);
            var types = AppDomain.CurrentDomain.GetAssemblies()
                .SelectMany(s => s.GetTypes())
                .Where(p => type.IsAssignableFrom(p) && !p.IsInterface && !p.IsAbstract);

            foreach (var idx in types)
            {
                var initializer = Activator.CreateInstance(idx) as IConfigureServices;
                initializer.Configure(services, configuration);
            }
        }

        public static void ConfigureApplication(IApplicationBuilder app, IKernel kernel)
        {
            LoadAssemblies();

            var initializeType = typeof(IConfigureApplication);
            var initializeTypes = AppDomain.CurrentDomain.GetAssemblies()
                .SelectMany(s => s.GetTypes())
                .Where(p => initializeType.IsAssignableFrom(p) && !p.IsInterface && !p.IsAbstract);

            foreach (var idx in initializeTypes)
            {
                var instance = Activator.CreateInstance(idx) as IConfigureApplication;
                instance.Configure(app, kernel);
            }
        }

        #region [ -- Private methods -- ]

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