/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using Microsoft.Extensions.Configuration;
using Ninject;
using magic.common.contracts;
using magic.signals.contracts;

namespace magic.signals.services
{
    public class Startup : IStartup
    {
        #region [ -- Interface implementations -- ]

        public void Configure(IKernel kernel, IConfiguration configuration)
        {
            var type = typeof(ISlot);
            var slots = AppDomain.CurrentDomain.GetAssemblies()
                .SelectMany(s => s.GetTypes())
                .Where(p => type.IsAssignableFrom(p) && !p.IsInterface && !p.IsAbstract && p.CustomAttributes.Any(x => x.AttributeType == typeof(SlotAttribute)));
            kernel.Bind<ISignaler>().ToConstant(new Signaler(slots, kernel));
        }

        #endregion
    }
}
