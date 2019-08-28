/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using magic.common.contracts;
using magic.signals.contracts;

namespace magic.signals.services.init
{
    public class ConfigureServices : IConfigureServices
    {
        #region [ -- Interface implementations -- ]

        public void Configure(IServiceCollection services, IConfiguration configuration)
        {
            var type = typeof(ISlot);
            var slots = AppDomain.CurrentDomain.GetAssemblies()
                .SelectMany(s => s.GetTypes())
                .Where(p => type.IsAssignableFrom(p) &&
                    !p.IsInterface &&
                    !p.IsAbstract &&
                    p.CustomAttributes.Any(x => x.AttributeType == typeof(SlotAttribute)));
            foreach (var idx in slots)
            {
                services.AddTransient(idx);
            }
            services.AddSingleton<ISignalsProvider>((svc) => new SignalsProvider(slots));
            services.AddTransient<ISignaler, Signaler>();
        }

        #endregion
    }
}
