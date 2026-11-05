/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System;
using System.IO;
using System.Linq;
using Moq;
using Xunit;
using magic.node;
using magic.node.contracts;
using magic.node.extensions;

namespace magic.lambda.puppeteer.tests
{
    /*
     * The launch options [puppeteer.connect] builds, which is everything it does before it starts a browser.
     * The environment variable it reads is process wide, hence the collection.
     */
    [Collection(SessionsCollection.Name)]
    public sealed class ConnectTests : IDisposable
    {
        static readonly string[] SandboxArgs = ["--no-sandbox", "--window-size=800,600"];
        static readonly string[] AB = ["--a", "--b"];
        static readonly string[] Keep = ["--keep"];

        readonly string _folder = Path.Combine(Path.GetTempPath(), "magic-puppeteer-" + Guid.NewGuid().ToString("N"));
        readonly string _executable;
        readonly string _previous = Environment.GetEnvironmentVariable("PUPPETEER_EXECUTABLE_PATH");

        public ConnectTests()
        {
            Directory.CreateDirectory(_folder);
            _executable = Path.Combine(_folder, "fake-chrome");
            File.WriteAllText(_executable, "");
        }

        public void Dispose()
        {
            Environment.SetEnvironmentVariable("PUPPETEER_EXECUTABLE_PATH", _previous);
            try
            {
                Directory.Delete(_folder, true);
            }
            catch
            {
                // Best effort, the folder is in the system's temp folder.
            }
            GC.SuppressFinalize(this);
        }

        Connect Slot()
        {
            var resolver = new Mock<IRootResolver>();
            resolver.Setup(x => x.AbsolutePath(It.IsAny<string>())).Returns<string>(x => Path.Combine(_folder, x.TrimStart('/')));
            return new Connect(resolver.Object);
        }

        Node Args(params Node[] children)
        {
            var node = new Node("puppeteer.connect");
            node.Add(new Node("executable", _executable));
            node.AddRange(children);
            return node;
        }

        [Fact]
        public void DefaultsToHeadlessWithTheGivenExecutable()
        {
            var options = Slot().BuildLaunchOptions(Args());
            Assert.True(options.Headless);
            Assert.Equal(_executable, options.ExecutablePath);
            Assert.Null(options.UserDataDir);
            Assert.True(options.Args == null || options.Args.Length == 0);
        }

        [Fact]
        public void HeadlessAndTimeoutAreRead()
        {
            var options = Slot().BuildLaunchOptions(Args(new Node("headless", false), new Node("timeout", 1234)));
            Assert.False(options.Headless);
            Assert.Equal(1234, options.Timeout);
        }

        [Fact]
        public void NonPositiveTimeoutIsIgnored()
        {
            var defaults = Slot().BuildLaunchOptions(Args()).Timeout;
            Assert.Equal(defaults, Slot().BuildLaunchOptions(Args(new Node("timeout", 0))).Timeout);
        }

        [Fact]
        public void UserDataDirIsResolvedThroughTheRootResolver()
        {
            var options = Slot().BuildLaunchOptions(Args(new Node("user-data-dir", "/profile")));
            Assert.Equal(Path.Combine(_folder, "profile"), options.UserDataDir);
        }

        [Fact]
        public void ArgumentsFromTextAndChildrenAreAccepted()
        {
            var text = Slot().BuildLaunchOptions(Args(new Node("args", "--no-sandbox --window-size=800,600")));
            Assert.Equal(SandboxArgs, text.Args);
            var children = Slot().BuildLaunchOptions(Args(new Node("args", null, [new Node(".", "--a"), new Node(".", "--b")])));
            Assert.Equal(AB, children.Args);
        }

        [Theory]
        [InlineData("--allow-file-access")]
        [InlineData("--ALLOW-FILE-ACCESS-FROM-FILES")]
        [InlineData("--disable-web-security")]
        public void DangerousArgumentsAreDropped(string denied)
        {
            var options = Slot().BuildLaunchOptions(Args(new Node("args", null, [new Node(".", "--keep"), new Node(".", denied)])));
            Assert.Equal(Keep, options.Args);
        }

        [Fact]
        public void OnlyDangerousArgumentsLeavesNoArguments()
        {
            var options = Slot().BuildLaunchOptions(Args(new Node("args", "--disable-web-security")));
            Assert.True(options.Args == null || options.Args.Length == 0);
        }

        [Fact]
        public void ExecutablePathAliasIsAccepted()
        {
            var node = new Node("puppeteer.connect", null, [new Node("executable-path", _executable)]);
            Assert.Equal(_executable, Connect.GetExecutablePath(node));
        }

        [Fact]
        public void EnvironmentVariableIsUsedWhenNoExecutableIsGiven()
        {
            Environment.SetEnvironmentVariable("PUPPETEER_EXECUTABLE_PATH", _executable);
            Assert.Equal(_executable, Connect.GetExecutablePath(new Node("puppeteer.connect")));
        }

        [Fact]
        public void MissingExplicitExecutableFallsThroughToTheEnvironment()
        {
            Environment.SetEnvironmentVariable("PUPPETEER_EXECUTABLE_PATH", _executable);
            var node = new Node("puppeteer.connect", null, [new Node("executable", Path.Combine(_folder, "does-not-exist"))]);
            Assert.Equal(_executable, Connect.GetExecutablePath(node));
        }

        [Fact]
        public void WithoutAnyBrowserTheErrorExplainsWhatToDo()
        {
            Environment.SetEnvironmentVariable("PUPPETEER_EXECUTABLE_PATH", null);
            var node = new Node("puppeteer.connect");
            string found = null;
            var ex = Record.Exception(() => found = Connect.GetExecutablePath(node));
            if (ex == null)
            {
                // A browser is installed in one of the default places on this machine, which is fine.
                Assert.True(File.Exists(found));
                return;
            }
            var error = Assert.IsType<HyperlambdaException>(ex);
            Assert.Contains("PUPPETEER_EXECUTABLE_PATH", error.Message);
        }
    }
}
