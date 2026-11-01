/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Xunit;
using magic.node;
using magic.node.extensions;
using magic.node.extensions.hyperlambda;

namespace magic.lambda.system.tests
{
    /*
     * The plugin slots keep their state in a static dictionary, so everything touching it is in one class,
     * and every test compiles an assembly of its own.
     */
    public class PluginTests : IDisposable
    {
        readonly Runtime _runtime = new Runtime();

        public void Dispose()
        {
            _runtime.Dispose();
            GC.SuppressFinalize(this);
        }

        static string Code(string slot, string value)
        {
            return @"
using magic.node;
using magic.signals.contracts;

namespace Plugin" + Guid.NewGuid().ToString("N") + @"
{
    [Slot(Name = """ + slot + @""")]
    public class Hello : ISlot
    {
        public void Signal(ISignaler signaler, Node input)
        {
            input.Value = """ + value + @""";
        }
    }
}";
        }

        static Node CompileNode(string code, string assemblyName)
        {
            var node = new Node("system.compile");
            node.Add(new Node("code", code));
            node.Add(new Node("assembly-name", assemblyName));
            var references = new Node("references");
            foreach (var idx in new[] { "System.Runtime", "System.Private.CoreLib", "magic.node", "magic.signals.contracts" })
            {
                references.Add(new Node(".", idx));
            }
            node.Add(references);
            return node;
        }

        byte[] Compile(string slot, string value, out string name)
        {
            name = "plugin" + Guid.NewGuid().ToString("N") + ".dll";
            var node = CompileNode(Code(slot, value), name);
            _runtime.Signaler.Signal("system.compile", node);
            return node.Get<byte[]>();
        }

        [Fact]
        public void CompileProducesAssemblyBytes()
        {
            var bytes = Compile("test.plugin.a", "a", out _);
            Assert.True(bytes.Length > 0);
            Assert.Equal((byte)'M', bytes[0]);
        }

        [Fact]
        public void CompileAcceptsAssemblyNameWithExtension()
        {
            var node = CompileNode(Code("test.plugin.b", "b"), "withext.dll");
            _runtime.Signaler.Signal("system.compile", node);
            Assert.True(node.Get<byte[]>().Length > 0);
        }

        [Fact]
        public void CompileErrorsThrowWithDiagnostics()
        {
            var ex = Assert.Throws<HyperlambdaException>(
                () => _runtime.Signaler.Signal("system.compile", CompileNode("this is not C#", "broken")));
            Assert.Contains("Compilation did not succeed", ex.Message);
        }

        [Fact]
        public void CompileWithUnknownReferenceThrows()
        {
            var node = CompileNode(Code("test.plugin.c", "c"), "x");
            node.Children.Last().Add(new Node(".", "no-such-assembly"));
            var ex = Assert.Throws<HyperlambdaException>(() => _runtime.Signaler.Signal("system.compile", node));
            Assert.Contains("no-such-assembly", ex.Message);
        }

        [Theory]
        [InlineData("code")]
        [InlineData("assembly-name")]
        [InlineData("references")]
        public void CompileRequiresItsArguments(string missing)
        {
            var node = CompileNode(Code("test.plugin.d", "d"), "x");
            node.Children.First(x => x.Name == missing).UnTie();
            Assert.Throws<HyperlambdaException>(() => _runtime.Signaler.Signal("system.compile", node));
        }

        [Fact]
        public void LoadFromBytesRegistersSlotListsAndUnloads()
        {
            var bytes = Compile("test.plugin.load", "loaded", out var name);

            _runtime.Signaler.Signal("system.plugin.load", new Node("system.plugin.load", bytes));

            var slot = new Node("test.plugin.load");
            _runtime.Signaler.Signal("test.plugin.load", slot);
            Assert.Equal("loaded", slot.Value);

            var list = new Node("system.plugin.list");
            _runtime.Signaler.Signal("system.plugin.list", list);
            Assert.Contains(list.Children, x => x.Get<string>() == name);

            _runtime.Signaler.Signal("system.plugin.unload", new Node("system.plugin.unload", name));
            var after = new Node("system.plugin.list");
            _runtime.Signaler.Signal("system.plugin.list", after);
            Assert.DoesNotContain(after.Children, x => x.Get<string>() == name);
            Assert.ThrowsAny<Exception>(() => _runtime.Signaler.Signal("test.plugin.load", new Node("test.plugin.load")));
        }

        [Fact]
        public void LoadFromFile()
        {
            var bytes = Compile("test.plugin.file", "from file", out var name);
            File.WriteAllBytes(Path.Combine(_runtime.Folder, name), bytes);

            _runtime.Signaler.Signal("system.plugin.load", new Node("system.plugin.load", "/" + name));

            var slot = new Node("test.plugin.file");
            _runtime.Signaler.Signal("test.plugin.file", slot);
            Assert.Equal("from file", slot.Value);
            _runtime.Signaler.Signal("system.plugin.unload", new Node("system.plugin.unload", name));
        }

        [Fact]
        public void LoadingTheSameAssemblyAgainReplacesIt()
        {
            var name = "samename" + Guid.NewGuid().ToString("N") + ".dll";
            var node = CompileNode(Code("test.plugin.replace", "first"), name);
            _runtime.Signaler.Signal("system.compile", node);
            var bytes = node.Get<byte[]>();

            _runtime.Signaler.Signal("system.plugin.load", new Node("system.plugin.load", bytes));
            _runtime.Signaler.Signal("system.plugin.load", new Node("system.plugin.load", bytes));

            var list = new Node("system.plugin.list");
            _runtime.Signaler.Signal("system.plugin.list", list);
            Assert.Single(list.Children, x => x.Get<string>() == name);
            var slot = new Node("test.plugin.replace");
            _runtime.Signaler.Signal("test.plugin.replace", slot);
            Assert.Equal("first", slot.Value);
            _runtime.Signaler.Signal("system.plugin.unload", new Node("system.plugin.unload", name));
        }

        [Fact]
        public void LoadOfUnsupportedValueThrows()
        {
            Assert.Throws<HyperlambdaException>(() => _runtime.Signaler.Signal("system.plugin.load", new Node("system.plugin.load", 42)));
        }

        [Fact]
        public void UnloadOfUnknownPluginThrows()
        {
            var ex = Assert.Throws<HyperlambdaException>(
                () => _runtime.Signaler.Signal("system.plugin.unload", new Node("system.plugin.unload", "never-loaded")));
            Assert.Contains("never-loaded", ex.Message);
        }

        [Fact]
        public async Task ExecuteLoadsRunsAndUnloads()
        {
            var bytes = Compile("test.plugin.exec", "executed", out var name);
            var node = new Node("system.plugin.execute", bytes);
            var call = new Node("test.plugin.exec");
            node.Add(call);

            await _runtime.Signaler.SignalAsync("system.plugin.execute", node);

            Assert.Null(node.Value);
            Assert.Equal("executed", call.Value);
            var list = new Node("system.plugin.list");
            _runtime.Signaler.Signal("system.plugin.list", list);
            Assert.DoesNotContain(list.Children, x => x.Get<string>() == name);
        }

        [Fact]
        public async Task ExecuteUnloadsEvenWhenTheLambdaThrows()
        {
            var bytes = Compile("test.plugin.exec2", "x", out var name);
            var node = new Node("system.plugin.execute", bytes);
            node.Add(new Node("throw", "failed"));

            await Assert.ThrowsAsync<HyperlambdaException>(() => _runtime.Signaler.SignalAsync("system.plugin.execute", node));

            var list = new Node("system.plugin.list");
            _runtime.Signaler.Signal("system.plugin.list", list);
            Assert.DoesNotContain(list.Children, x => x.Get<string>() == name);
        }
    }
}
