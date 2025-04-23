/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using magic.node;
using magic.node.contracts;
using magic.signals.services;
using magic.signals.contracts;
using magic.data.common.contracts;
using magic.node.extensions.hyperlambda;

namespace magic.data.common.tests
{
    public static class Common
    {
        internal class DbSettings : IDataSettings
        {
            public string DefaultDatabaseType { get; } = "mysql";

            public string ConnectionString(string name, string databaseType = null) => "foo";
        }

        static public Node Evaluate(string hl, bool config = true)
        {
            var signaler = Initialize(config);
            var lambda = HyperlambdaParser.Parse(hl);
            signaler.Signal("eval", lambda);
            return lambda;
        }

        static async public Task<Node> EvaluateAsync(string hl)
        {
            var signaler = Initialize();
            var lambda = HyperlambdaParser.Parse(hl);
            await signaler.SignalAsync("eval", lambda);
            return lambda;
        }

        public static ISignaler Initialize(bool config = true)
        {
            var services = new ServiceCollection();
            services.AddTransient<ISignaler, Signaler>();
            var types = new SignalsProvider(InstantiateAllTypes<ISlot, ISlotAsync>(services));
            services.AddTransient<ISignalsProvider>((svc) => types);
            services.AddTransient<IDataSettings, DbSettings>();
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
