/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Threading;
using Xunit;
using ExecutionContext = magic.signals.contracts.ExecutionContext;

namespace magic.signals.tests
{
    public class ExecutionContextTests
    {
        static ExecutionContext Create() => new ExecutionContext("exec", new CancellationTokenSource());

        [Fact]
        public void ConstructorRejectsNulls()
        {
            Assert.Throws<ArgumentNullException>(() => new ExecutionContext(null, new CancellationTokenSource()));
            Assert.Throws<ArgumentNullException>(() => new ExecutionContext("exec", null));
        }

        [Fact]
        public void CancelCancelsTheToken()
        {
            var context = Create();
            Assert.False(context.IsCancellationRequested);
            context.ThrowIfCancellationRequested();
            context.Cancel();
            Assert.True(context.IsCancellationRequested);
            Assert.Throws<OperationCanceledException>(() => context.ThrowIfCancellationRequested());
        }

        [Fact]
        public void TimeoutMustBePositive()
        {
            var context = Create();
            Assert.Throws<ArgumentOutOfRangeException>(() => context.TrySetTimeout(TimeSpan.Zero));
            Assert.Throws<ArgumentOutOfRangeException>(() => context.TrySetTimeout(TimeSpan.FromSeconds(-1)));
        }

        [Fact]
        public void TimeoutSetsDeadlineAndOnlyAcceptsEarlierOnes()
        {
            var context = Create();
            Assert.Null(context.DeadlineUtc);
            Assert.True(context.TrySetTimeout(TimeSpan.FromMinutes(10)));
            var first = context.DeadlineUtc;
            Assert.NotNull(first);
            Assert.False(context.TrySetTimeout(TimeSpan.FromMinutes(20)));
            Assert.Equal(first, context.DeadlineUtc);
            Assert.True(context.TrySetTimeout(TimeSpan.FromMinutes(5)));
            Assert.True(context.DeadlineUtc < first);
            context.Cleanup();
        }

        [Fact]
        public void TimeoutCancelsTheContext()
        {
            var context = Create();
            Assert.True(context.TrySetTimeout(TimeSpan.FromMilliseconds(50)));
            Assert.True(context.Token.WaitHandle.WaitOne(TimeSpan.FromSeconds(10)));
            Assert.True(context.IsCancellationRequested);
        }

        [Fact]
        public void TimeoutOnCancelledContextIsRefused()
        {
            var context = Create();
            context.Cancel();
            Assert.False(context.TrySetTimeout(TimeSpan.FromMinutes(1)));
        }

        [Fact]
        public void ReferencesAreCounted()
        {
            var context = Create();
            Assert.Equal(1, context.ReferenceCount);
            Assert.True(context.AddReference());
            Assert.Equal(2, context.ReferenceCount);
            Assert.Equal(1, context.Release());
            Assert.Equal(0, context.Release());
            Assert.False(context.AddReference());
            Assert.Equal(0, context.ReferenceCount);
            Assert.Throws<InvalidOperationException>(() => context.Release());
        }

        [Fact]
        public void CleanupDisposesTheCancellationSource()
        {
            var context = Create();
            context.TrySetTimeout(TimeSpan.FromMinutes(1));
            context.Cleanup();
            Assert.Throws<ObjectDisposedException>(() => context.Cancellation.Token.WaitHandle.WaitOne(0));
        }

        [Fact]
        public void ResourcesAreStored()
        {
            var context = Create();
            context.Resources["foo"] = 42;
            Assert.Equal(42, context.Resources["foo"]);
            Assert.Equal("exec", context.ExecutionId);
            Assert.True(context.StartedUtc <= DateTime.UtcNow);
        }
    }
}
