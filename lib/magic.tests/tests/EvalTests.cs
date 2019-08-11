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
            var lambda = Evaluate(".dest\nadd:x:../*/.dest\n   .\n      foo1:bar1\n      foo2:bar2");
            Assert.Equal(2, lambda.Children.First().Children.Count());
            Assert.Equal("foo1", lambda.Children.First().Children.First().Name);
            Assert.Equal("bar1", lambda.Children.First().Children.First().Value);
            Assert.Equal("foo2", lambda.Children.First().Children.Skip(1).First().Name);
            Assert.Equal("bar2", lambda.Children.First().Children.Skip(1).First().Value);
        }

        [Fact]
        public void AddExpressionSrc()
        {
            var lambda = Evaluate(".dest\n.src\n   foo1:bar1\n   foo2:bar2\nadd:x:../*/.dest\n   nodes:x:../*/.src/*");
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
        public void Count_01()
        {
            var lambda = Evaluate(".foo1\n   bar1\n   bar2\ncount:x:../*/.foo1/*");
            Assert.Equal(2, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void SetWithChild()
        {
            var lambda = Evaluate(".foo1\nset-node:x:../*/.foo1\n   .src\n      foo2:bar2");
            Assert.Equal("foo2", lambda.Children.First().Name);
            Assert.Equal("bar2", lambda.Children.First().Value);
        }

        [Fact]
        public void SetWithNull()
        {
            var lambda = Evaluate(".foo1\n   foo2\nset-node:x:../*/.foo1/*");
            Assert.Empty(lambda.Children.First().Children);
        }

        [Fact]
        public void SetExpressionSource()
        {
            var lambda = Evaluate(".foo1\n.foo2:bar2\nset-node:x:../*/.foo1\n   nodes:x:../*/.foo2");
            Assert.Equal(".foo2", lambda.Children.First().Name);
            Assert.Equal("bar2", lambda.Children.First().Value);
        }

        [Fact]
        public void SetNameWithStatic()
        {
            var lambda = Evaluate(".foo1\nset-name:x:../*/.foo1\n   .:.foo2");
            Assert.Equal(".foo2", lambda.Children.First().Name);
        }

        [Fact]
        public void SetNameWithExpression()
        {
            var lambda = Evaluate(".foo1:.bar1\nset-name:x:../*/.foo1\n   value:x:../*/.foo1");
            Assert.Equal(".bar1", lambda.Children.First().Name);
        }

        [Fact]
        public void SetValueWithStatic()
        {
            var lambda = Evaluate(".foo1\nset-value:x:../*/.foo1\n   .:OK");
            Assert.Equal("OK", lambda.Children.First().Value);
        }

        [Fact]
        public void SetValueWithExpression()
        {
            var lambda = Evaluate(".foo1:.bar1\nset-value:x:../*/.foo1\n   name:x:../*/.foo1");
            Assert.Equal(".foo1", lambda.Children.First().Value);
        }

        [Fact]
        public void ForEach_01()
        {
            Evaluate(".foo1\n   bar1\n   bar2\nfor-each:x:../*/.foo1/*\n   foo2");
            Assert.Equal(2, Foo2Slot.ExecutionCount);
        }

        [Fact]
        public void Eq_01()
        {
            var lambda = Evaluate(".foo1:OK\neq\n   value:x:../*/.foo1\n   .:OK");
            Assert.Equal(true, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Eq_02()
        {
            var lambda = Evaluate(".foo1:not OK\neq\n   value:x:../*/.foo1\n   .:OK");
            Assert.Equal(false, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Not_01()
        {
            var lambda = Evaluate(".foo1:OK\nnot\n   eq\n      value:x:../*/.foo1\n      .:OK");
            Assert.Equal(false, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Mt_01()
        {
            var lambda = Evaluate(".foo1:A\nmt\n   value:x:../*/.foo1\n   .:B");
            Assert.Equal(false, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Mt_02()
        {
            var lambda = Evaluate(".foo1:B\nmt\n   value:x:../*/.foo1\n   .:A");
            Assert.Equal(true, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Lt_01()
        {
            var lambda = Evaluate(".foo1:A\nlt\n   value:x:../*/.foo1\n   .:B");
            Assert.Equal(true, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Lt_02()
        {
            var lambda = Evaluate(".foo1:B\nlt\n   value:x:../*/.foo1\n   .:A");
            Assert.Equal(false, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Lte_01()
        {
            var lambda = Evaluate(".foo1:A\nlte\n   value:x:../*/.foo1\n   .:A");
            Assert.Equal(true, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Lte_02()
        {
            var lambda = Evaluate(".foo1:A\nlte\n   value:x:../*/.foo1\n   .:B");
            Assert.Equal(true, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Lte_03()
        {
            var lambda = Evaluate(".foo1:B\nlte\n   value:x:../*/.foo1\n   .:A");
            Assert.Equal(false, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Mte_01()
        {
            var lambda = Evaluate(".foo1:A\nmte\n   value:x:../*/.foo1\n   .:A");
            Assert.Equal(true, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Mte_02()
        {
            var lambda = Evaluate(".foo1:A\nmte\n   value:x:../*/.foo1\n   .:B");
            Assert.Equal(false, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Mte_03()
        {
            var lambda = Evaluate(".foo1:B\nmte\n   value:x:../*/.foo1\n   .:A");
            Assert.Equal(true, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void And_01()
        {
            var lambda = Evaluate(".foo1:bool:true\nand\n   value:x:../*/.foo1\n   .:bool:true");
            Assert.Equal(true, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void And_02()
        {
            var lambda = Evaluate(".foo1:bool:true\nand\n   value:x:../*/.foo1\n   .:bool:true\n   .:bool:false");
            Assert.Equal(false, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Or_01()
        {
            var lambda = Evaluate(".foo1:bool:true\nor\n   value:x:../*/.foo1\n   .:bool:false");
            Assert.Equal(true, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Or_02()
        {
            var lambda = Evaluate(".foo1:bool:false\nor\n   value:x:../*/.foo1\n   .:bool:true\n   .:bool:false");
            Assert.Equal(true, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Or_03()
        {
            var lambda = Evaluate(".foo1:bool:false\nor\n   value:x:../*/.foo1\n   .:bool:false\n   .:bool:false");
            Assert.Equal(false, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void If_01()
        {
            var lambda = Evaluate(".result\nif\n   .:bool:true\n   .lambda\n      set-value:x:../*/.result\n         .:OK");
            Assert.Equal("OK", lambda.Children.First().Value);
        }

        [Fact]
        public void If_02()
        {
            var lambda = Evaluate(".result\nif\n   and\n      .:bool:true\n      .:bool:true\n   .lambda\n      set-value:x:../*/.result\n         .:OK");
            Assert.Equal("OK", lambda.Children.First().Value);
        }

        [Fact]
        public void If_03()
        {
            var lambda = Evaluate(".result\nif\n   and\n      .:bool:true\n      .:bool:false\n   .lambda\n      set-value:x:../*/.result\n         .:FAILURE");
            Assert.Null(lambda.Children.First().Value);
        }

        [Fact]
        public void Else_01()
        {
            var lambda = Evaluate(@"
.result
if
   .:bool:false
   .lambda
      set-value:x:../*/.result
         .:failure
else
   .lambda
      set-value:x:../*/.result
         .:OK");
            Assert.Equal("OK", lambda.Children.First().Value);
        }

        [Fact]
        public void ElseIf_01()
        {
            var lambda = Evaluate(@"
.result
if
   .:bool:false
   .lambda
      set-value:x:../*/.result
         .:failure
else-if
   eq
      name:x:../*/.result
      .:.result
   .lambda
      set-value:x:../*/.result
         .:OK");
            Assert.Equal("OK", lambda.Children.First().Value);
        }

        [Fact]
        public void While_01()
        {
            var lambda = Evaluate(@".src
   bar1
   bar2
.dest
while
   mt
      count:x:../*/.src/*
      .:int:0
   .lambda
      add:x:../*/.dest
         nodes:x:../*/.src/0
      set-node:x:../*/.src/0");
            Assert.Equal(2, lambda.Children.Skip(1).First().Children.Count());
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
