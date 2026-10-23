/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Threading.Tasks;
using Xunit;
using magic.node;
using magic.signals.services;
using magic.signals.contracts;

namespace magic.signals.tests
{
    /*
     * Tests for which slots SignalsProvider considers safe to share between invocations.
     */
    public class StatelessSlotTests
    {
        [Slot(Name = "test.stateless.plain")]
        public class Plain : ISlot
        {
            public void Signal(ISignaler signaler, Node input) { }
        }

        [Slot(Name = "test.stateless.async")]
        public class PlainAsync : ISlotAsync
        {
            public Task SignalAsync(ISignaler signaler, Node input) => Task.CompletedTask;
        }

        [Slot(Name = "test.stateless.field")]
        public class WithField : ISlot
        {
            int _count;

            public void Signal(ISignaler signaler, Node input) { input.Value = ++_count; }
        }

        [Slot(Name = "test.stateless.autoproperty")]
        public class WithAutoProperty : ISlot
        {
            public int Count { get; set; }

            public void Signal(ISignaler signaler, Node input) { input.Value = ++Count; }
        }

        [Slot(Name = "test.stateless.ctorargument")]
        public class WithConstructorArgument : ISlot
        {
            public WithConstructorArgument(IServiceProvider provider) { }

            public void Signal(ISignaler signaler, Node input) { }
        }

        [Slot(Name = "test.stateless.disposable")]
        public class Disposing : ISlot, IDisposable
        {
            public void Signal(ISignaler signaler, Node input) { }

            public void Dispose() { }
        }

        public class BaseWithField
        {
            protected int _state;
        }

        [Slot(Name = "test.stateless.basefield")]
        public class WithBaseField : BaseWithField, ISlot
        {
            public void Signal(ISignaler signaler, Node input) { input.Value = ++_state; }
        }

        [Slot(Name = "test.stateless.twoctors")]
        public class WithTwoConstructors : ISlot
        {
            public WithTwoConstructors() { }

            public WithTwoConstructors(IServiceProvider provider) { }

            public void Signal(ISignaler signaler, Node input) { }
        }

        static SignalsProvider Create()
        {
            return new SignalsProvider(new[]
            {
                typeof(Plain), typeof(PlainAsync), typeof(WithField), typeof(WithAutoProperty),
                typeof(WithConstructorArgument), typeof(Disposing), typeof(WithBaseField), typeof(WithTwoConstructors),
            });
        }

        [Fact]
        public void SlotWithoutStateOrConstructorArguments_IsSharedAndOfRightType()
        {
            var provider = Create();
            var first = provider.GetStatelessSlot("test.stateless.plain");
            Assert.IsType<Plain>(first);
            Assert.Same(first, provider.GetStatelessSlot("test.stateless.plain"));
            Assert.IsType<PlainAsync>(provider.GetStatelessSlot("test.stateless.async"));
        }

        [Theory]
        [InlineData("test.stateless.field")]
        [InlineData("test.stateless.autoproperty")]
        [InlineData("test.stateless.ctorargument")]
        [InlineData("test.stateless.disposable")]
        [InlineData("test.stateless.basefield")]
        [InlineData("test.stateless.twoctors")]
        [InlineData("test.stateless.nonexisting")]
        public void SlotWithStateOrDependencies_IsNeverShared(string name)
        {
            Assert.Null(Create().GetStatelessSlot(name));
        }

        [Fact]
        public void RemovedSlot_IsNoLongerShared()
        {
            var provider = Create();
            Assert.NotNull(provider.GetStatelessSlot("test.stateless.plain"));
            provider.Remove(typeof(Plain));
            Assert.Null(provider.GetStatelessSlot("test.stateless.plain"));
            Assert.Null(provider.GetSlot("test.stateless.plain"));
        }

        [Fact]
        public void SlotAddedLater_IsShared_IfStateless()
        {
            var provider = new SignalsProvider(Array.Empty<Type>());
            Assert.Null(provider.GetStatelessSlot("test.stateless.plain"));
            provider.Add(typeof(Plain));
            provider.Add(typeof(WithField));
            Assert.IsType<Plain>(provider.GetStatelessSlot("test.stateless.plain"));
            Assert.Null(provider.GetStatelessSlot("test.stateless.field"));
        }
    }
}
