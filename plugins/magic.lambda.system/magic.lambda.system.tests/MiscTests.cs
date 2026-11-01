/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using Xunit;
using magic.node;
using magic.node.extensions;
using magic.node.extensions.hyperlambda;

namespace magic.lambda.system.tests
{
    public class MiscTests
    {
        readonly Runtime _runtime = new Runtime();

        [Fact]
        public void OperatingSystemDescription()
        {
            var node = new Node("system.os");
            _runtime.Signaler.Signal("system.os", node);
            Assert.Equal(RuntimeInformation.OSDescription, node.Value);
        }

        [Fact]
        public void IsOperatingSystem()
        {
            var current = RuntimeInformation.IsOSPlatform(OSPlatform.Windows) ? "WINDOWS" :
                RuntimeInformation.IsOSPlatform(OSPlatform.OSX) ? "OSX" : "LINUX";
            var yes = new Node("system.is-os", current);
            _runtime.Signaler.Signal("system.is-os", yes);
            Assert.Equal(true, yes.Value);

            var no = new Node("system.is-os", "NOT-AN-OS");
            _runtime.Signaler.Signal("system.is-os", no);
            Assert.Equal(false, no.Value);
        }

        [Fact]
        public async Task DebugRecordsEverySlotInvocation()
        {
            var lambda = HyperlambdaParser.Parse("system.debug\n   .foo:bar\n   set-value:x:@.foo\n      .:changed");
            await _runtime.Signaler.SignalAsync("eval", lambda);
            var steps = lambda.Children.First().Children.ToList();
            Assert.NotEmpty(steps);
            Assert.All(steps, x => Assert.NotNull(x.Children.FirstOrDefault(y => y.Name == "slot")));
            Assert.Contains(steps, x => x.Children.First(y => y.Name == "slot").Get<string>() == "set-value");
        }

        [Fact]
        public async Task DebugReturnsWhatTheLambdaReturns()
        {
            var lambda = HyperlambdaParser.Parse("system.debug\n   return:foo");
            await _runtime.Signaler.SignalAsync("eval", lambda);
            var returned = lambda.Children.First().Children.Single(x => x.Name == "returned");
            Assert.Equal("foo", returned.Value);
        }

        [Fact]
        public async Task DebugRecordsTheErrorOfAFailingLambda()
        {
            var lambda = HyperlambdaParser.Parse("system.debug\n   throw:oops");
            await _runtime.Signaler.SignalAsync("eval", lambda);
            var error = lambda.Children.First().Children.Last();
            Assert.Equal("error", error.Name);
            Assert.Equal("oops", error.Value);
            Assert.Equal(typeof(HyperlambdaException).FullName, error.Children.First(x => x.Name == "type").Value);
        }
    }
}
