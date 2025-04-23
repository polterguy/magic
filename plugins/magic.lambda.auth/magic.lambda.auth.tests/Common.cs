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
using magic.lambda.auth.contracts;

namespace magic.lambda.auth.tests
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

    public static class Common
    {
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

        public static ISignaler Initialize(bool createTicket = true, bool config = true)
        {
            var services = new ServiceCollection();
            services.AddTransient<ISignaler, Signaler>();
            var types = new SignalsProvider(InstantiateAllTypes<ISlot, ISlotAsync>(services));
            services.AddTransient<ISignalsProvider>((svc) => types);
            services.AddTransient<ITicketProvider, TicketProvider>((svc) => new TicketProvider(createTicket));
            var mockConfiguration = new Mock<IMagicConfiguration>();
            if (config)
            {
                mockConfiguration.SetupGet(x => x[It.Is<string>(x2 => x2 == "magic:auth:secret")]).Returns("some-secret-goes-here");
                mockConfiguration.SetupGet(x => x[It.Is<string>(x2 => x2 == "magic:auth:valid-minutes")]).Returns("20");
            }
            services.AddTransient((svc) => mockConfiguration.Object);
            services.AddTransient<IAuthSettings, AuthSettings>();
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
