/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using System.Collections.Generic;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using magic.node;
using magic.common.contracts;
using magic.signals.contracts;

namespace magic.signals.tests
{
    public class SignalTests
    {
        #region [ -- Unit tests -- ]

        [Fact]
        public void Signal()
        {
            var kernel = Initialize();
            var signaler = kernel.GetService(typeof(ISignaler)) as ISignaler;
            var input = new Node();
            input.Add(new Node("bar", "Jo!"));
            signaler.Signal("foo.bar", input);
            Assert.Equal("Jo!Yup!", input.Children.First().Get<string>());
        }

        [Fact]
        public void SignalNoExisting_Throws()
        {
            var kernel = Initialize();
            var signaler = kernel.GetService(typeof(ISignaler)) as ISignaler;
            Assert.Throws<ApplicationException>(() => signaler.Signal("foo.bar-XXX", new Node()));
        }

        #endregion

        #region [ -- Private helper methods -- ]

        IServiceProvider Initialize()
        {
            var configuration = new ConfigurationBuilder().Build();
            var services = new ServiceCollection();
            services.AddTransient<IConfiguration>((svc) => configuration);
            foreach (var idx in InstantiateAllTypes<IConfigureServices>())
            {
                idx.Configure(services, configuration);
            }
            var provider = services.BuildServiceProvider();
            return provider;
        }

        static IEnumerable<T> InstantiateAllTypes<T>() where T : class
        {
            var type = typeof(T);
            var types = AppDomain.CurrentDomain.GetAssemblies()
                .SelectMany(s => s.GetTypes())
                .Where(p => type.IsAssignableFrom(p) && !p.IsInterface && !p.IsAbstract);

            foreach (var idx in types)
            {
                yield return Activator.CreateInstance(idx) as T;
            }
        }

        #endregion
    }
}
