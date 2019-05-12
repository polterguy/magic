/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using Microsoft.Extensions.Configuration;
using magic.common.contracts;
using magic.signals.contracts;
using Microsoft.Extensions.DependencyInjection;

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
                .Where(p => type.IsAssignableFrom(p) && !p.IsInterface && !p.IsAbstract && p.CustomAttributes.Any(x => x.AttributeType == typeof(SlotAttribute)));
            foreach (var idx in slots)
            {
                services.AddTransient(idx);
            }
            services.AddSingleton<ISignaler>((svc) => new Signaler(svc, slots));
        }

        #endregion
    }
}
