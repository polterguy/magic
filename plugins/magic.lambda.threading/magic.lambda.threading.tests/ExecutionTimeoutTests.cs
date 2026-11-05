/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
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
using magic.node.extensions.hyperlambda;

namespace magic.lambda.threading.tests
{
    [Slot(Name = "test.threading.enter")]
    public class StubEnter : ISlot
    {
        static int _current;
        public static int Max { get; set; }

        public void Signal(ISignaler signaler, Node input)
        {
            var now = Interlocked.Increment(ref _current);
            if (now > Max)
                Max = now;
            Thread.Sleep(50);
            Interlocked.Decrement(ref _current);
        }
    }

    public class ExecutionTimeoutTests
    {
        static ISignaler GetSignaler()
        {
            _ = typeof(ExecutionTimeout);
            var services = new ServiceCollection();
            services.AddTransient<ISignaler, Signaler>();
            services.AddSingleton<IExecutionRegistry, ExecutionRegistry>();
            var type1 = typeof(ISlot);
            var type2 = typeof(ISlotAsync);
            var types = AppDomain.CurrentDomain.GetAssemblies()
                .Where(x => !x.IsDynamic && !x.FullName.StartsWith("Microsoft", StringComparison.InvariantCulture))
                .SelectMany(s => s.GetTypes())
                .Where(p => (type1.IsAssignableFrom(p) || type2.IsAssignableFrom(p)) && !p.IsInterface && !p.IsAbstract)
                .ToList();
            foreach (var idx in types)
            {
                services.AddTransient(idx);
            }
            var provider = new SignalsProvider(types);
            services.AddTransient<ISignalsProvider>(svc => provider);
            return services.BuildServiceProvider().GetService<ISignaler>();
        }

        [Fact]
        public async Task TimeoutIsAppliedToTheCurrentExecution()
        {
            var signaler = GetSignaler();
            var context = new magic.signals.contracts.ExecutionContext("exec", new CancellationTokenSource());
            var lambda = HyperlambdaParser.Parse("execution.timeout:int:60000");
            await signaler.ScopeAsync("execution.context", context, async () => await signaler.SignalAsync("eval", lambda));
            Assert.True((bool)lambda.Children.First().Value);
            Assert.NotNull(context.DeadlineUtc);
            context.Cleanup();
        }

        [Fact]
        public async Task TimeoutMustBePositive()
        {
            var signaler = GetSignaler();
            var context = new magic.signals.contracts.ExecutionContext("exec", new CancellationTokenSource());
            var lambda = HyperlambdaParser.Parse("execution.timeout:int:0");
            await Assert.ThrowsAsync<ArgumentOutOfRangeException>(() =>
                signaler.ScopeAsync("execution.context", context, async () => await signaler.SignalAsync("eval", lambda)));
        }

        [Fact]
        public async Task TimeoutWithoutExecutionContextThrows()
        {
            var lambda = HyperlambdaParser.Parse("execution.timeout:int:1000");
            await Assert.ThrowsAsync<InvalidOperationException>(() => GetSignaler().SignalAsync("eval", lambda));
        }

        [Fact]
        public async Task SemaphoreSerializesAccessByName()
        {
            var name = Guid.NewGuid().ToString("N");
            StubEnter.Max = 0;
            var tasks = Enumerable.Range(0, 4).Select(_ => Task.Run(async () =>
            {
                var lambda = HyperlambdaParser.Parse("semaphore:" + name + "\n   test.threading.enter");
                await GetSignaler().SignalAsync("eval", lambda);
            }));
            await Task.WhenAll(tasks);
            Assert.Equal(1, StubEnter.Max);
        }

        [Fact]
        public async Task KillCancelsARunningExecutionByItsId()
        {
            var signaler = GetSignaler();
            var registry = new ExecutionRegistry();
            var execution = registry.Create();
            var kill = new ExecutionKill(registry);
            var node = new Node("execution.kill", execution.ExecutionId);
            kill.Signal(signaler, node);
            Assert.True((bool)node.Value);
            Assert.True(execution.IsCancellationRequested);
            var unknown = new Node("execution.kill", "no-such-execution");
            kill.Signal(signaler, unknown);
            Assert.False((bool)unknown.Value);
            registry.Complete(execution.ExecutionId);
            await Task.CompletedTask;
        }
    }
}
