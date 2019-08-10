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
using magic.hyperlambda;
using magic.common.contracts;
using magic.signals.contracts;
using magic.node;

namespace magic.tests.tests
{
    public class EvalTests
    {
        [Slot(Name = "foo")]
        public class FooSlot : ISlot
        {
            public void Signal(Node input)
            {
                input.Value = "OK";
            }
        }

        [Fact]
        public void InvokeLocalSignal()
        {
            var services = Initialize();
            var hl = @"foo";
            var lambda = new Parser(hl).Lambda();
            var signaler = services.GetService(typeof(ISignaler)) as ISignaler;
            signaler.Signal("eval", lambda);
            Assert.Equal("OK", lambda.Children.First().Value);
        }

        [Fact]
        public void AddChildrenSrc()
        {
            var services = Initialize();
            var hl = ".dest\nadd:x:../*/.dest\n  .\n    foo1:bar1\n    foo2:bar2";
            var lambda = new Parser(hl).Lambda();
            var signaler = services.GetService(typeof(ISignaler)) as ISignaler;
            signaler.Signal("eval", lambda);
            Assert.Equal(2, lambda.Children.First().Children.Count());
            Assert.Equal("foo1", lambda.Children.First().Children.First().Name);
            Assert.Equal("bar1", lambda.Children.First().Children.First().Value);
            Assert.Equal("foo2", lambda.Children.First().Children.Skip(1).First().Name);
            Assert.Equal("bar2", lambda.Children.First().Children.Skip(1).First().Value);
        }

        [Fact]
        public void AddExpressionSrc()
        {
            var services = Initialize();
            var hl = ".dest\n.src\n  foo1:bar1\n  foo2:bar2\nadd:x:../*/.dest\n  src:x:../*/.src/*";
            var lambda = new Parser(hl).Lambda();
            var signaler = services.GetService(typeof(ISignaler)) as ISignaler;
            signaler.Signal("eval", lambda);
            Assert.Equal(2, lambda.Children.First().Children.Count());
            Assert.Equal("foo1", lambda.Children.First().Children.First().Name);
            Assert.Equal("bar1", lambda.Children.First().Children.First().Value);
            Assert.Equal("foo2", lambda.Children.First().Children.Skip(1).First().Name);
            Assert.Equal("bar2", lambda.Children.First().Children.Skip(1).First().Value);
        }

        [Fact]
        public void Value()
        {
            var services = Initialize();
            var hl = ".src:foo1\nvalue:x:../*/.src";
            var lambda = new Parser(hl).Lambda();
            var signaler = services.GetService(typeof(ISignaler)) as ISignaler;
            signaler.Signal("eval", lambda);
            Assert.Equal("foo1", lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Name()
        {
            var services = Initialize();
            var hl = ".foo1\nname:x:../*/.foo1";
            var lambda = new Parser(hl).Lambda();
            var signaler = services.GetService(typeof(ISignaler)) as ISignaler;
            signaler.Signal("eval", lambda);
            Assert.Equal(".foo1", lambda.Children.Skip(1).First().Value);
        }

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
