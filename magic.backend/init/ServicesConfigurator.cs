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

namespace magic.backend.init
{
    public class ServicesConfigurator
    {
        static bool _hasLoaded = false;

        public static void ConfigureServicesCollection(IServiceCollection services, IConfiguration configuration)
        {
            // Force all assemblies in location into AppDomain
            LoadAssemblies();

            // Instantiating and invoking IConfigureServices.Configure on all types that requires such
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

        public static void ConfigureApplicationBuilder(IApplicationBuilder app)
        {
            // Force all assemblies in location into AppDomain
            LoadAssemblies();

            // Instantiating and invoking IConfigureApplication.Configure on all types that requires such
            var type = typeof(IConfigureApplication);
            var types = AppDomain.CurrentDomain.GetAssemblies()
                .SelectMany(s => s.GetTypes())
                .Where(p => type.IsAssignableFrom(p) && !p.IsInterface && !p.IsAbstract);
            foreach (var idx in types)
            {
                var initializer = Activator.CreateInstance(idx) as IConfigureApplication;
                initializer.Configure(app);
            }
        }

        #region [ -- Private methods -- ]

        static void LoadAssemblies()
        {
            // Checking if we have already done this.
            if (_hasLoaded)
                return;

            // Forcing all assemblies in base directory of web app into AppDomain.
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