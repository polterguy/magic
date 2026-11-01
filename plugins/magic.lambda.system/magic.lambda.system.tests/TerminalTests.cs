/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Diagnostics;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Xunit;
using magic.node;
using magic.node.extensions;

namespace magic.lambda.system.tests
{
    public class TerminalTests : IDisposable
    {
        readonly Runtime _runtime = new Runtime();

        public void Dispose()
        {
            _runtime.Dispose();
            GC.SuppressFinalize(this);
        }

        async Task<Node> Execute(string command, Action<Node> args = null)
        {
            var node = new Node("system.execute", command);
            args?.Invoke(node);
            await _runtime.Signaler.SignalAsync("system.execute", node);
            return node;
        }

        [Fact]
        public async Task CapturesStandardOutput()
        {
            var node = await Execute("dotnet", x => x.Add(new Node("args", "--version")));
            Assert.Matches(@"^\d+\.\d+\.\d+", node.Get<string>());
            Assert.Empty(node.Children);
        }

        [Fact]
        public async Task ArgumentsFromChildNodes()
        {
            var node = await Execute("dotnet", x =>
            {
                var args = new Node("args");
                args.Add(new Node(".", "--version"));
                args.Add(new Node(".", ""));
                x.Add(args);
            });
            Assert.Matches(@"^\d+\.\d+\.\d+", node.Get<string>());
        }

        [Fact]
        public async Task QuotedArgumentsAreSplit()
        {
            if (OperatingSystem.IsWindows())
                return;
            var node = await Execute("echo", x => x.Add(new Node("args", "hello \"big world\" 'it\\'s ok'   done")));
            Assert.Equal("hello big world it's ok done", node.Get<string>());
        }

        [Fact]
        public async Task NoArgumentsIsFine()
        {
            if (OperatingSystem.IsWindows())
                return;
            var node = await Execute("pwd");
            Assert.False(string.IsNullOrEmpty(node.Get<string>()));
        }

        [Fact]
        public async Task EmptyArgumentsAreIgnored()
        {
            if (OperatingSystem.IsWindows())
                return;
            var node = await Execute("echo", x => x.Add(new Node("args", "   ")));
            Assert.Equal("", node.Get<string>());
        }

        [Fact]
        public async Task WorkingDirectoryIsResolvedThroughRootResolver()
        {
            if (OperatingSystem.IsWindows())
                return;
            Directory.CreateDirectory(Path.Combine(_runtime.Folder, "work"));
            var node = await Execute("pwd", x => x.Add(new Node("working-directory", "/work")));
            Assert.EndsWith("/work", node.Get<string>());
        }

        [Fact]
        public async Task FailingCommandThrowsWithItsError()
        {
            var ex = await Assert.ThrowsAsync<HyperlambdaException>(
                () => Execute("dotnet", x => x.Add(new Node("args", "--this-option-does-not-exist"))));
            Assert.False(string.IsNullOrWhiteSpace(ex.Message));
        }

        [Fact]
        public async Task MissingCommandThrows()
        {
            await Assert.ThrowsAsync<HyperlambdaException>(() => Execute(" "));
        }

        [Fact]
        public async Task CancellationKillsTheProcess()
        {
            if (OperatingSystem.IsWindows())
                return;
            using var cts = new CancellationTokenSource();
            var context = new magic.signals.contracts.ExecutionContext("exec-1", cts);
            var node = new Node("system.execute", "sleep");
            node.Add(new Node("args", "30"));
            var watch = Stopwatch.StartNew();
            cts.CancelAfter(300);
            await Assert.ThrowsAnyAsync<OperationCanceledException>(
                () => _runtime.Signaler.ScopeAsync("execution.context", context,
                    async () => await _runtime.Signaler.SignalAsync("system.execute", node)));
            Assert.True(watch.Elapsed < TimeSpan.FromSeconds(20));
        }

        [Fact]
        public async Task FailureMessageIsStandardError()
        {
            if (OperatingSystem.IsWindows())
                return;
            var ex = await Assert.ThrowsAsync<HyperlambdaException>(
                () => Execute("sh", x => x.Add(new Node("args", "-c \"echo out; echo err 1>&2; exit 3\""))));
            Assert.Equal("err", ex.Message);
        }

        [Fact]
        public async Task FailureMessageFallsBackToStandardOutput()
        {
            if (OperatingSystem.IsWindows())
                return;
            var ex = await Assert.ThrowsAsync<HyperlambdaException>(
                () => Execute("sh", x => x.Add(new Node("args", "-c \"echo out; exit 3\""))));
            Assert.Equal("out", ex.Message);
        }
    }
}
