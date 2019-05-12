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
using Newtonsoft.Json.Linq;
using magic.common.contracts;
using magic.signals.contracts;

namespace magic.signals.tests
{
    public class SignalTests
    {
        #region [ -- Unit tests -- ]

        [Fact]
        public void Signal ()
        {
            var kernel = Initialize();
            var signaler = kernel.GetService(typeof(ISignaler)) as ISignaler;
            var input = new JObject
            {
                ["bar"] = "Jo!",
            };
            signaler.Signal("foo.bar", input);
            Assert.Equal("Jo!Yup!", input["bar"].Value<string>());
        }

        #endregion

        #region [ -- Private helper methods -- ]

        IServiceProvider Initialize()
        {
            var configuration = new ConfigurationBuilder().Build();
            var kernel = new ServiceCollection();
            kernel.AddTransient<IConfiguration>((svc) => configuration);
            foreach (var idx in InstantiateAllTypes<IConfigureServices>())
            {
                idx.Configure(kernel, configuration);
            }
            var provider = kernel.BuildServiceProvider();
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
                var instance = Activator.CreateInstance(idx) as T;
                yield return instance;
            }
        }

        #endregion
    }
}
