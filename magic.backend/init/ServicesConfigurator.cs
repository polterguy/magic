/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using magic.contracts.common;

namespace magic.backend.init
{
    public class ServicesConfigurator
    {
        public static void Configure(IServiceCollection services, IConfiguration configuration)
        {
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