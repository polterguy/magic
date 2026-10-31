/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Threading;
using Xunit;
using magic.signals.services;

namespace magic.signals.tests
{
    public class ExecutionRegistryTests
    {
        [Fact]
        public void CreateRegistersTheExecution()
        {
            var registry = new ExecutionRegistry();
            var context = registry.Create();

            Assert.False(string.IsNullOrEmpty(context.ExecutionId));
            Assert.True(registry.TryGet(context.ExecutionId, out var found));
            Assert.Same(context, found);
            Assert.False(context.IsCancellationRequested);
        }

        [Fact]
        public void EveryExecutionGetsItsOwnId()
        {
            var registry = new ExecutionRegistry();
            Assert.NotEqual(registry.Create().ExecutionId, registry.Create().ExecutionId);
        }

        [Theory]
        [InlineData("no-such-execution")]
        [InlineData("")]
        [InlineData(null)]
        public void UnknownExecutionsAreNotFound(string id)
        {
            var registry = new ExecutionRegistry();
            Assert.False(registry.TryGet(id, out var found));
            Assert.Null(found);
            Assert.False(registry.TryCancel(id));
        }

        [Fact]
        public void TryCancelCancelsTheExecution()
        {
            var registry = new ExecutionRegistry();
            var context = registry.Create();

            Assert.True(registry.TryCancel(context.ExecutionId));
            Assert.True(context.IsCancellationRequested);
        }

        [Fact]
        public void TryCancelReturnsFalseForAnExecutionThatWasCleanedUp()
        {
            var registry = new ExecutionRegistry();
            var context = registry.Create();
            context.Cleanup();

            Assert.False(registry.TryCancel(context.ExecutionId));
        }

        [Fact]
        public void CancellingTheCallersTokenCancelsTheExecution()
        {
            var registry = new ExecutionRegistry();
            using var caller = new CancellationTokenSource();
            var context = registry.Create(caller.Token);
            Assert.False(context.IsCancellationRequested);

            caller.Cancel();

            Assert.True(context.IsCancellationRequested);
        }

        [Fact]
        public void CompleteRemovesAnExecutionNobodyElseHoldsAReferenceTo()
        {
            var registry = new ExecutionRegistry();
            var context = registry.Create();

            registry.Complete(context.ExecutionId);

            Assert.False(registry.TryGet(context.ExecutionId, out _));
            Assert.Throws<ObjectDisposedException>(() => context.Cancel());
        }

        [Fact]
        public void CompleteKeepsTheExecutionUntilTheLastReferenceIsReleased()
        {
            var registry = new ExecutionRegistry();
            var context = registry.Create();
            Assert.True(context.AddReference());

            registry.Complete(context.ExecutionId);
            Assert.True(registry.TryGet(context.ExecutionId, out _));
            Assert.Equal(1, context.ReferenceCount);

            registry.Complete(context.ExecutionId);
            Assert.False(registry.TryGet(context.ExecutionId, out _));
        }

        [Theory]
        [InlineData("no-such-execution")]
        [InlineData(null)]
        public void CompletingAnUnknownExecutionDoesNothing(string id)
        {
            new ExecutionRegistry().Complete(id);
        }
    }
}
