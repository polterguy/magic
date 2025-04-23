/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.Extensions.DependencyInjection;
using magic.node;
using magic.signals.services;
using magic.signals.contracts;
using magic.node.extensions.hyperlambda;
using magic.lambda.auth.contracts;
using magic.node.contracts;
using Moq;

namespace magic.lambda.threading.tests
{
    public static class Common
    {
        class AuthSettings : IAuthSettings
        {
            public string Secret { get; } = "sdfgoihsasdfoug345675xdfDFGUGHRTWEJRBWefkug76^£$%dfg";
            public bool HttpsOnly { get; } = false;
            public int ValidMinutes { get; } = 120;
            public string AuthenticationSlot { get; } = "foo.bar";
            public string LDAP { get; } = "foo.bar.ldap";
            public string AutoAuthSlot { get; } = "howdy.world";
            public bool AllowRegistration { get; } = true;
            public string ConfirmEmailAddress { get; } = null;
        }

        private class TicketProvider : ITicketProvider
        {
            readonly bool _auth;
            public TicketProvider(bool auth)
            {
                _auth = auth;
            }

            public string Username => _auth ? "foo" : null;

            public IEnumerable<string> Roles => _auth ? new string[] { "bar1", "bar2" } : Array.Empty<string>();

            public IEnumerable<(string Name, string Value)> Claims => new List<(string Name, string Value)>();

            public bool InRole(string role)
            {
                return Roles.Contains(role);
            }

            public bool IsAuthenticated()
            {
                return _auth;
            }

            public bool IsHttp
            {
                get
                {
                    return false;
                }
            }
        }

        static public Node Evaluate(string hl)
        {
            var services = Initialize();
            var lambda = HyperlambdaParser.Parse(hl);
            var signaler = services.GetService(typeof(ISignaler)) as ISignaler;
            var evalResult = new Node();
            signaler.Scope("slots.result", evalResult, () =>
            {
                signaler.Signal("eval", lambda);
            });
            return lambda;
        }

        static async public Task<Node> EvaluateAsync(string hl)
        {
            var services = Initialize();
            var lambda = HyperlambdaParser.Parse(hl);
            var signaler = services.GetService(typeof(ISignaler)) as ISignaler;
            var evalResult = new Node();
            await signaler.ScopeAsync("slots.result", evalResult, async () =>
            {
                await signaler.SignalAsync("eval", lambda);
            });
            return lambda;
        }

        #region [ -- Private helper methods -- ]

        static IServiceProvider Initialize()
        {
            var services = new ServiceCollection();
            services.AddTransient<ISignaler, Signaler>();
            var types = new SignalsProvider(InstantiateAllTypes<ISlot, ISlotAsync>(services));
            services.AddTransient<ISignalsProvider>((svc) => types);
            services.AddTransient<ITicketProvider, TicketProvider>((svc) => new TicketProvider(true));
            var mockConfiguration = new Mock<IMagicConfiguration>();
            mockConfiguration.SetupGet(x => x[It.Is<string>(x2 => x2 == "magic:auth:secret")]).Returns("some-secret-goes-here");
            mockConfiguration.SetupGet(x => x[It.Is<string>(x2 => x2 == "magic:auth:valid-minutes")]).Returns("20");
            services.AddTransient((svc) => mockConfiguration.Object);
            services.AddTransient<IAuthSettings, AuthSettings>();
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
