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
using magic.hyperlambda;
using magic.common.contracts;
using magic.signals.contracts;

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

        [Slot(Name = "foo2")]
        public class Foo2Slot : ISlot
        {
            public static int ExecutionCount;

            public void Signal(Node input)
            {
                ++ExecutionCount;
            }
        }

        [Fact]
        public void InvokeLocalSignal()
        {
            var lambda = Evaluate(@"foo");
            Assert.Equal("OK", lambda.Children.First().Value);
        }

        [Fact]
        public void AddChildrenSrc()
        {
            var lambda = Evaluate(".dest\nadd:x:../*/.dest\n  .\n    foo1:bar1\n    foo2:bar2");
            Assert.Equal(2, lambda.Children.First().Children.Count());
            Assert.Equal("foo1", lambda.Children.First().Children.First().Name);
            Assert.Equal("bar1", lambda.Children.First().Children.First().Value);
            Assert.Equal("foo2", lambda.Children.First().Children.Skip(1).First().Name);
            Assert.Equal("bar2", lambda.Children.First().Children.Skip(1).First().Value);
        }

        [Fact]
        public void AddExpressionSrc()
        {
            var lambda = Evaluate(".dest\n.src\n  foo1:bar1\n  foo2:bar2\nadd:x:../*/.dest\n  src:x:../*/.src/*");
            Assert.Equal(2, lambda.Children.First().Children.Count());
            Assert.Equal("foo1", lambda.Children.First().Children.First().Name);
            Assert.Equal("bar1", lambda.Children.First().Children.First().Value);
            Assert.Equal("foo2", lambda.Children.First().Children.Skip(1).First().Name);
            Assert.Equal("bar2", lambda.Children.First().Children.Skip(1).First().Value);
        }

        [Fact]
        public void Value()
        {
            var lambda = Evaluate(".src:foo1\nvalue:x:../*/.src");
            Assert.Equal("foo1", lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Name()
        {
            var lambda = Evaluate(".foo1\nname:x:../*/.foo1");
            Assert.Equal(".foo1", lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void SetWithChild()
        {
            var lambda = Evaluate(".foo1\nset:x:../*/.foo1\n  .src\n    foo2:bar2");
            Assert.Equal("foo2", lambda.Children.First().Name);
            Assert.Equal("bar2", lambda.Children.First().Value);
        }

        [Fact]
        public void SetWithNull()
        {
            var lambda = Evaluate(".foo1\n  foo2\nset:x:../*/.foo1/*");
            Assert.Empty(lambda.Children.First().Children);
        }

        [Fact]
        public void SetExpressionSource()
        {
            var lambda = Evaluate(".foo1\n.foo2:bar2\nset:x:../*/.foo1\n  src:x:../*/.foo2");
            Assert.Equal(".foo2", lambda.Children.First().Name);
            Assert.Equal("bar2", lambda.Children.First().Value);
        }

        [Fact]
        public void SetNameWithStatic()
        {
            var lambda = Evaluate(".foo1\nset-name:x:../*/.foo1\n  .:.foo2");
            Assert.Equal(".foo2", lambda.Children.First().Name);
        }

        [Fact]
        public void SetNameWithExpression()
        {
            var lambda = Evaluate(".foo1:.bar1\nset-name:x:../*/.foo1\n  value:x:../*/.foo1");
            Assert.Equal(".bar1", lambda.Children.First().Name);
        }

        [Fact]
        public void SetValueWithStatic()
        {
            var lambda = Evaluate(".foo1\nset-value:x:../*/.foo1\n  .:OK");
            Assert.Equal("OK", lambda.Children.First().Value);
        }

        [Fact]
        public void SetValueWithExpression()
        {
            var lambda = Evaluate(".foo1:.bar1\nset-value:x:../*/.foo1\n  name:x:../*/.foo1");
            Assert.Equal(".foo1", lambda.Children.First().Value);
        }

        [Fact]
        public void ForEach_01()
        {
            Evaluate(".foo1\n  bar1\n  bar2\nfor-each:x:../*/.foo1/*\n  foo2");
            Assert.Equal(2, Foo2Slot.ExecutionCount);
        }

        #region [ -- Private helper methods -- ]

        Node Evaluate(string hl)
        {
            var services = Initialize();
            var lambda = new Parser(hl).Lambda();
            var signaler = services.GetService(typeof(ISignaler)) as ISignaler;
            signaler.Signal("eval", lambda);
            return lambda;
        }

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
