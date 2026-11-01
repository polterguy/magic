/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using magic.node;
using magic.signals.services;
using magic.signals.contracts;

namespace magic.signals.tests
{
    /*
     * A slot holding state, with a constructor taking no arguments, which is not registered in the container below.
     */
    [Slot(Name = "extra.stateful")]
    public class StatefulSlot : ISlot
    {
        int _calls;

        public void Signal(ISignaler signaler, Node input)
        {
            input.Value = ++_calls;
        }
    }

    /*
     * A slot the container knows nothing about, which takes the service provider as its only argument, which is how
     * slots in dynamically loaded assemblies are created.
     */
    [Slot(Name = "extra.with-provider")]
    public class WithProviderSlot : ISlot
    {
        readonly IServiceProvider _provider;

        public WithProviderSlot(IServiceProvider provider)
        {
            _provider = provider;
        }

        public void Signal(ISignaler signaler, Node input)
        {
            input.Value = _provider != null;
        }
    }

    [Slot(Name = "")]
    class NamelessSlot
    {
    }

    [Slot(Name = "extra.not-a-slot")]
    class NotASlot
    {
    }

    public class ExtraSignalTests
    {
        static ISignaler Signaler(params Type[] types)
        {
            var services = new ServiceCollection();
            services.AddTransient<ISignaler, Signaler>();
            services.AddSingleton<ISignalsProvider>(new SignalsProvider(types));
            return services.BuildServiceProvider().GetService<ISignaler>();
        }

        [Fact]
        public void StatefulSlotUnknownToTheContainerIsCreatedWithItsDefaultConstructor()
        {
            var node = new Node("extra.stateful");
            Signaler(typeof(StatefulSlot)).Signal("extra.stateful", node);
            Assert.Equal(1, node.Value);
        }

        [Fact]
        public void SlotUnknownToTheContainerGetsTheServiceProviderPassedIn()
        {
            var node = new Node("extra.with-provider");
            Signaler(typeof(WithProviderSlot)).Signal("extra.with-provider", node);
            Assert.True((bool)node.Value);
        }

        [Fact]
        public void UnknownSlotThrows()
        {
            var ex = Assert.Throws<magic.node.extensions.HyperlambdaException>(() => Signaler().Signal("does.not.exist", new Node()));
            Assert.Contains("does.not.exist", ex.Message);
        }

        [Fact]
        public void ProviderRejectsSlotWithoutName()
        {
            Assert.Throws<ArgumentNullException>(() => new SignalsProvider([typeof(NamelessSlot)]));
            Assert.Throws<ArgumentNullException>(() => new SignalsProvider([]).Add(typeof(NamelessSlot)));
        }

        [Fact]
        public void ProviderRejectsTypeThatIsNotASlot()
        {
            var ex = Assert.Throws<ArgumentException>(() => new SignalsProvider([typeof(NotASlot)]));
            Assert.Contains("does not implement", ex.Message);
            Assert.Throws<ArgumentException>(() => new SignalsProvider([]).Add(typeof(NotASlot)));
        }

        [Fact]
        public void ProviderRejectsDuplicateSlots()
        {
            var ex = Assert.Throws<ArgumentException>(() => new SignalsProvider([typeof(StatefulSlot), typeof(StatefulSlot)]));
            Assert.Contains("already registered", ex.Message);
            var provider = new SignalsProvider([typeof(StatefulSlot)]);
            Assert.Throws<ArgumentException>(() => provider.Add(typeof(StatefulSlot)));
        }

        [Fact]
        public void ProviderAddsAndRemovesSlots()
        {
            var provider = new SignalsProvider([]);
            provider.Add(typeof(StatefulSlot));
            Assert.Equal(typeof(StatefulSlot), provider.GetSlot("extra.stateful"));
            provider.Remove(typeof(StatefulSlot));
            Assert.Null(provider.GetSlot("extra.stateful"));
        }

        [Fact]
        public void RegistryLinksToACancellableToken()
        {
            var registry = new ExecutionRegistry();
            using var parent = new CancellationTokenSource();
            var context = registry.Create(parent.Token);
            Assert.False(context.IsCancellationRequested);
            parent.Cancel();
            Assert.True(context.IsCancellationRequested);
            registry.Complete(context.ExecutionId);
        }

        [Fact]
        public void RegistryHandlesUnknownAndNullIds()
        {
            var registry = new ExecutionRegistry();
            Assert.False(registry.TryCancel(null));
            Assert.False(registry.TryCancel("nope"));
            Assert.False(registry.TryGet(null, out _));
            registry.Complete(null);
            registry.Complete("nope");
        }

        [Fact]
        public void RegistryTracksAndReleasesExecutions()
        {
            var registry = new ExecutionRegistry();
            var context = registry.Create();
            Assert.True(registry.TryGet(context.ExecutionId, out var found));
            Assert.Same(context, found);
            Assert.True(registry.TryCancel(context.ExecutionId));
            registry.Complete(context.ExecutionId);
            Assert.False(registry.TryGet(context.ExecutionId, out _));
        }

        [Fact]
        public void CancellingADisposedExecutionIsRefused()
        {
            var registry = new ExecutionRegistry();
            var context = registry.Create();
            context.Cleanup();
            Assert.False(registry.TryCancel(context.ExecutionId));
        }
    }
}
