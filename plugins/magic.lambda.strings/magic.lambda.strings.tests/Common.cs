/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.Extensions.DependencyInjection;
using magic.node;
using magic.lambda.logging.contracts;
using magic.signals.services;
using magic.signals.contracts;
using magic.node.extensions.hyperlambda;

namespace magic.lambda.strings.tests
{
    public static class Common
    {
        private class NullLogger : ILogger
        {
            public Task<object> DebugAsync(string content) => Task.FromResult<object>(null);
            public Task<object> DebugAsync(string content, Dictionary<string, string> meta) => Task.FromResult<object>(null);
            public Task<object> InfoAsync(string content) => Task.FromResult<object>(null);
            public Task<object> InfoAsync(string content, Dictionary<string, string> meta) => Task.FromResult<object>(null);
            public Task<object> ErrorAsync(string content) => Task.FromResult<object>(null);
            public Task<object> ErrorAsync(string content, Dictionary<string, string> meta) => Task.FromResult<object>(null);
            public Task<object> ErrorAsync(string content, string stackTrace) => Task.FromResult<object>(null);
            public Task<object> ErrorAsync(string content, Dictionary<string, string> meta, string stackTrace) => Task.FromResult<object>(null);
            public Task<object> FatalAsync(string content) => Task.FromResult<object>(null);
            public Task<object> FatalAsync(string content, Dictionary<string, string> meta) => Task.FromResult<object>(null);
            public Task<object> FatalAsync(string content, string stackTrace) => Task.FromResult<object>(null);
            public Task<object> FatalAsync(string content, Dictionary<string, string> meta, string stackTrace) => Task.FromResult<object>(null);
        }

        static public Node Evaluate(string hl)
        {
            var services = Initialize();
            var lambda = HyperlambdaParser.Parse(hl);
            var signaler = services.GetService(typeof(ISignaler)) as ISignaler;
            signaler.Signal("eval", lambda);
            return lambda;
        }

        static public async Task<Node> EvaluateAsync(string hl)
        {
            var services = Initialize();
            var lambda = HyperlambdaParser.Parse(hl);
            var signaler = services.GetService(typeof(ISignaler)) as ISignaler;
            await signaler.SignalAsync("eval", lambda);
            return lambda;
        }

        #region [ -- Private helper methods -- ]

        static IServiceProvider Initialize()
        {
            var services = new ServiceCollection();
            services.AddTransient<ISignaler, Signaler>();
            services.AddSingleton<ILogger, NullLogger>();
            var types = new SignalsProvider(InstantiateAllTypes<ISlot, ISlotAsync>(services));
            services.AddTransient<ISignalsProvider>((svc) => types);
            var provider = services.BuildServiceProvider();
            return provider;
        }

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
