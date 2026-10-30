/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using magic.node;
using magic.signals.services;
using magic.signals.contracts;

namespace magic.signals.tests
{
    /*
     * Characterization tests for the lifetime of slot instances, pinning that a slot holding state never
     * sees the state of a previous invocation, such that stateless slot instances can be reused safely.
     */
    public class SlotInstanceCharacterizationTests
    {
        public class Dependency
        {
            public int Count { get; set; }
        }

        [Slot(Name = "test.instance.counter")]
        public class CounterSlot : ISlot
        {
            int _count;

            public void Signal(ISignaler signaler, Node input)
            {
                input.Value = ++_count;
            }
        }

        [Slot(Name = "test.instance.counter.async")]
        public class CounterAsyncSlot : ISlotAsync
        {
            int _count;

            public Task SignalAsync(ISignaler signaler, Node input)
            {
                input.Value = ++_count;
                return Task.CompletedTask;
            }
        }

        [Slot(Name = "test.instance.dependency")]
        public class DependencySlot : ISlot
        {
            readonly Dependency _dependency;

            public DependencySlot(Dependency dependency)
            {
                _dependency = dependency;
            }

            public void Signal(ISignaler signaler, Node input)
            {
                input.Value = ++_dependency.Count;
            }
        }

        [Slot(Name = "test.instance.stateless")]
        public class StatelessSlot : ISlot
        {
            public void Signal(ISignaler signaler, Node input)
            {
                input.Value = "stateless";
            }
        }

        [Slot(Name = "test.instance.disposable")]
        public class DisposableSlot : ISlot, IDisposable
        {
            public static int Disposed;

            public void Signal(ISignaler signaler, Node input)
            {
                input.Value = "disposable";
            }

            public void Dispose()
            {
                Disposed += 1;
                GC.SuppressFinalize(this);
            }
        }

        static ISignaler Create()
        {
            var services = new ServiceCollection();
            services.AddTransient<ISignaler, Signaler>();
            services.AddTransient<Dependency>();
            var types = new[] { typeof(CounterSlot), typeof(CounterAsyncSlot), typeof(DependencySlot), typeof(StatelessSlot), typeof(DisposableSlot) };
            foreach (var idx in types)
            {
                services.AddTransient(idx);
            }
            var provider = new SignalsProvider(types);
            services.AddTransient<ISignalsProvider>(svc => provider);
            return services.BuildServiceProvider().GetService<ISignaler>();
        }

        [Fact]
        public void SlotWithState_NeverSeesStateOfPreviousInvocation()
        {
            var signaler = Create();
            var results = Enumerable.Range(0, 3).Select(_ =>
            {
                var node = new Node();
                signaler.Signal("test.instance.counter", node);
                return (int)node.Value;
            });
            Assert.Equal(new[] { 1, 1, 1 }, results);
        }

        [Fact]
        public async Task AsyncSlotWithState_NeverSeesStateOfPreviousInvocation()
        {
            var signaler = Create();
            for (var idx = 0; idx < 3; idx++)
            {
                var node = new Node();
                await signaler.SignalAsync("test.instance.counter.async", node);
                Assert.Equal(1, node.Value);
            }
        }

        [Fact]
        public void SlotWithConstructorDependency_GetsFreshDependencyEachInvocation()
        {
            var signaler = Create();
            for (var idx = 0; idx < 3; idx++)
            {
                var node = new Node();
                signaler.Signal("test.instance.dependency", node);
                Assert.Equal(1, node.Value);
            }
        }

        [Fact]
        public void StatelessSlot_ReturnsSameResultEveryInvocation()
        {
            var signaler = Create();
            for (var idx = 0; idx < 3; idx++)
            {
                var node = new Node();
                signaler.Signal("test.instance.stateless", node);
                Assert.Equal("stateless", node.Value);
            }
        }

        [Fact]
        public void DisposableSlot_StillWorks_EveryInvocation()
        {
            var signaler = Create();
            for (var idx = 0; idx < 3; idx++)
            {
                var node = new Node();
                signaler.Signal("test.instance.disposable", node);
                Assert.Equal("disposable", node.Value);
            }
        }
    }
}
