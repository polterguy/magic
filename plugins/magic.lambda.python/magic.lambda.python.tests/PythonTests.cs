/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Xunit;
using magic.node;
using magic.node.contracts;
using magic.node.extensions;
using magic.signals.services;
using magic.signals.contracts;

namespace magic.lambda.python.tests
{
    /*
     * A fact that only runs when python3 is installed, which the slot needs.
     */
    public sealed class PythonFactAttribute : FactAttribute
    {
        static readonly bool _hasPython = HasPython();

        public PythonFactAttribute()
        {
            if (!_hasPython)
                Skip = "python3 is not installed";
        }

        static bool HasPython()
        {
            try
            {
                using var process = Process.Start(new ProcessStartInfo("python3", "--version") { RedirectStandardOutput = true, RedirectStandardError = true });
                process.WaitForExit();
                return process.ExitCode == 0;
            }
            catch
            {
                return false;
            }
        }
    }

    public sealed class PythonTests : IDisposable
    {
        readonly string _root = Path.Combine(Path.GetTempPath(), "magic-python-tests-" + Guid.NewGuid().ToString("N"));
        readonly ISignaler _signaler;

        public PythonTests()
        {
            Directory.CreateDirectory(_root);
            _ = typeof(PythonExecute);
            var services = new ServiceCollection();
            services.AddTransient<ISignaler, Signaler>();
            var resolver = new Mock<IRootResolver>();
            resolver.SetupGet(x => x.DynamicFiles).Returns(_root + "/");
            resolver.Setup(x => x.AbsolutePath(It.IsAny<string>())).Returns<string>(x => _root + "/" + x.TrimStart('/'));
            services.AddSingleton(resolver.Object);
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
            _signaler = services.BuildServiceProvider().GetService<ISignaler>();
        }

        public void Dispose()
        {
            try
            {
                Directory.Delete(_root, true);
            }
            catch
            {
                // Best effort, the folder is in the system's temp folder.
            }
            GC.SuppressFinalize(this);
        }

        async Task<Node> Run(params (string Name, object Value)[] args)
        {
            var node = new Node("python.execute");
            foreach (var (name, value) in args)
            {
                node.Add(new Node(name, value));
            }
            await _signaler.SignalAsync("python.execute", node);
            return node;
        }

        [PythonFact]
        public async Task CodeIsRunAndItsOutputCaptured()
        {
            var node = await Run(("code", "import sys\nprint('hello')\nprint('warn', file=sys.stderr)"));
            Assert.Equal("hello", node.Value);
            Assert.Equal("warn", node.Children.First(x => x.Name == "stderr").Value);
            Assert.Equal(0, node.Children.First(x => x.Name == "exit_code").Value);
        }

        [PythonFact]
        public async Task FileIsRunThroughTheRootResolver()
        {
            File.WriteAllText(Path.Combine(_root, "script.py"), "print(6 * 7)");
            var node = await Run(("file", "/script.py"));
            Assert.Equal("42", node.Value);
        }

        [PythonFact]
        public async Task ArgumentsFromChildrenAndFromText()
        {
            const string code = "import sys\nprint('|'.join(sys.argv[1:]))";
            var fromChildren = await Run(("code", code), ("args", null));
            Assert.Equal("", fromChildren.Value);

            var args = new Node("args", null, [new Node(".", "a"), new Node(".", " "), new Node(".", "b c")]);
            var node = new Node("python.execute", null, [new Node("code", code), args]);
            await _signaler.SignalAsync("python.execute", node);
            Assert.Equal("a|b c", node.Value);

            var text = await Run(("code", code), ("args", "one \"two words\" 'three \\' four' five"));
            Assert.Equal("one|two words|three ' four|five", text.Value);
        }

        [PythonFact]
        public async Task StandardInputIsPassedOn()
        {
            var node = await Run(("code", "import sys\nprint(sys.stdin.read().upper())"), ("stdin", "hello"));
            Assert.Equal("HELLO", node.Value);
        }

        [PythonFact]
        public async Task WorkingDirectoryIsResolvedThroughTheRootResolver()
        {
            Directory.CreateDirectory(Path.Combine(_root, "work"));
            var node = await Run(("code", "import os\nprint(os.path.basename(os.getcwd()))"), ("working-directory", "/work"));
            Assert.Equal("work", node.Value);
        }

        [PythonFact]
        public async Task FailureThrowsWithStandardError()
        {
            var ex = await Assert.ThrowsAsync<HyperlambdaException>(() => Run(("code", "raise ValueError('boom')")));
            Assert.Contains("ValueError: boom", ex.Message);
        }

        [PythonFact]
        public async Task FailureFallsBackToStandardOutput()
        {
            var ex = await Assert.ThrowsAsync<HyperlambdaException>(() => Run(("code", "import sys\nprint('only stdout')\nsys.exit(3)")));
            Assert.Equal("only stdout", ex.Message);
        }

        [PythonFact]
        public async Task TimeoutKillsTheProcess()
        {
            var watch = Stopwatch.StartNew();
            var ex = await Assert.ThrowsAsync<HyperlambdaException>(() => Run(("code", "import time\ntime.sleep(60)"), ("timeout", 1)));
            Assert.Contains("timed out after 1 seconds", ex.Message);
            Assert.True(watch.Elapsed < TimeSpan.FromSeconds(30));
        }

        [PythonFact]
        public async Task CancellationIsNotReportedAsATimeout()
        {
            using var cts = new CancellationTokenSource();
            var context = new magic.signals.contracts.ExecutionContext("exec", cts);
            var node = new Node("python.execute", null, [new Node("code", "import time\ntime.sleep(60)")]);
            cts.CancelAfter(500);
            await Assert.ThrowsAnyAsync<OperationCanceledException>(() =>
                _signaler.ScopeAsync("execution.context", context, async () => await _signaler.SignalAsync("python.execute", node)));
        }

        [Fact]
        public async Task ExactlyOneOfCodeAndFileIsRequired()
        {
            await Assert.ThrowsAsync<HyperlambdaException>(() => Run());
            await Assert.ThrowsAsync<HyperlambdaException>(() => Run(("code", "print(1)"), ("file", "/x.py")));
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-5)]
        public async Task TimeoutMustBePositive(int timeout)
        {
            var ex = await Assert.ThrowsAsync<HyperlambdaException>(() => Run(("code", "print(1)"), ("timeout", timeout)));
            Assert.Contains("[timeout]", ex.Message);
        }
    }
}
