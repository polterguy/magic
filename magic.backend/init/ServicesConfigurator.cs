/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.IO;
using System.Linq;
using System.Reflection;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using magic.common.contracts;

namespace magic.backend.init
{
    public class ServicesConfigurator
    {
        public static void Configure(IServiceCollection services, IConfiguration configuration)
        {
            // Forcing all assemblies in base directory of web app into AppDomain
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
    }
}