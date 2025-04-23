/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Collections.Generic;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using magic.node.contracts;
using magic.signals.services;
using magic.signals.contracts;

namespace magic.lambda.config.tests
{
    public static class Common
    {
        public static ISignaler Initialize()
        {
            var services = new ServiceCollection();
            services.AddTransient<ISignaler, Signaler>();
            var mockConfiguration = new Mock<IMagicConfiguration>();
            mockConfiguration.SetupGet(x => x[It.IsAny<string>()]).Returns("bar-xx");
            services.AddTransient((svc) => mockConfiguration.Object);
            var types = new SignalsProvider(InstantiateAllTypes<ISlot, ISlotAsync>(services));
            services.AddTransient<ISignalsProvider>((svc) => types);
            var provider = services.BuildServiceProvider();
            return provider.GetService<ISignaler>();
        }

        #region [ -- Private helper methods -- ]

        static IEnumerable<Type> InstantiateAllTypes<T1, T2>(ServiceCollection services)
        {
            var type1 = typeof(T1);
            var type2 = typeof(T2);
            var result = AppDomain.CurrentDomain.GetAssemblies()
                .Where(x => !x.IsDynamic && !x.FullName.StartsWith("Microsoft", StringComparison.InvariantCulture))
                .SelectMany(s => s.GetTypes())
                .Where(p => (type1.IsAssignableFrom(p) || type2.IsAssignableFrom(p)) && !p.IsInterface && !p.IsAbstract);

            foreach (var idx in result)
            {
                services.AddTransient(idx);
            }
            return result;
        }

        #endregion
    }
}
