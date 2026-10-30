/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.IO;
using System.Threading.Tasks;
using Xunit;
using magic.node;
using magic.node.contracts;
using magic.node.extensions;
using magic.node.services;
using magic.lambda.io.file;

namespace magic.lambda.io.tests
{
    /*
     * [io.file.mixin] reads a file again only when it has changed, so these use real files and the real services.
     */
    public class MixinCachingTests : IDisposable
    {
        class Root : IRootResolver
        {
            readonly string _dir;
            public Root(string dir) { _dir = dir.TrimEnd('/') + "/"; }
            public string DynamicFiles => _dir;
            public string RootFolder => _dir;
            public string AbsolutePath(string path) => _dir + path.TrimStart('/', '\\');
            public string RuntimePath(string path) => _dir + path.TrimStart('/', '\\');
            public string RelativePath(string path) => path.Substring(_dir.Length - 1);
        }

        readonly string _dir = Path.Combine(Path.GetTempPath(), "mixin-caching-" + Guid.NewGuid().ToString("N"));

        public MixinCachingTests()
        {
            Directory.CreateDirectory(_dir);
        }

        public void Dispose()
        {
            Directory.Delete(_dir, true);
            GC.SuppressFinalize(this);
        }

        async Task<string> Mix(string filename)
        {
            var files = new FileService();
            var slot = new Mixin(files, new StreamService(files), new Root(_dir));
            var node = new Node("io.file.mixin", filename);
            node.Add(new Node(".x", "X"));
            await slot.SignalAsync(null, node);
            return node.Get<string>();
        }

        [Fact]
        public async Task SameFileTwice_GivesTheSameResult()
        {
            File.WriteAllText(Path.Combine(_dir, "a.html"), "<p>{{*/.x}} and {{*/.x}}</p>");
            Assert.Equal("<p>X and X</p>", await Mix("/a.html"));
            Assert.Equal("<p>X and X</p>", await Mix("/a.html"));
        }

        [Fact]
        public async Task ChangedFile_IsReadAgain()
        {
            var path = Path.Combine(_dir, "a.html");
            File.WriteAllText(path, "<p>one {{*/.x}}</p>");
            Assert.Equal("<p>one X</p>", await Mix("/a.html"));

            // A different length, which is what tells the files apart, however quickly it is written.
            File.WriteAllText(path, "<p>two, which is longer {{*/.x}}</p>");
            Assert.Equal("<p>two, which is longer X</p>", await Mix("/a.html"));
        }

        [Fact]
        public async Task SameLengthChangedLater_IsReadAgain()
        {
            var path = Path.Combine(_dir, "a.html");
            File.WriteAllText(path, "<p>aaa</p>");
            Assert.Equal("<p>aaa</p>", await Mix("/a.html"));

            File.WriteAllText(path, "<p>bbb</p>");
            File.SetLastWriteTimeUtc(path, DateTime.UtcNow.AddMinutes(1));
            Assert.Equal("<p>bbb</p>", await Mix("/a.html"));
        }

        [Fact]
        public async Task DeletedFile_ThrowsAsItAlwaysDid()
        {
            var path = Path.Combine(_dir, "a.html");
            File.WriteAllText(path, "<p>x</p>");
            Assert.Equal("<p>x</p>", await Mix("/a.html"));
            File.Delete(path);
            await Assert.ThrowsAsync<FileNotFoundException>(() => Mix("/a.html"));
        }

        [Fact]
        public async Task LargeFile_IsServedAndFollowsChanges()
        {
            var path = Path.Combine(_dir, "big.html");
            File.WriteAllText(path, new string('a', 300 * 1024) + "{{*/.x}}");
            Assert.EndsWith("aX", await Mix("/big.html"));
            File.WriteAllText(path, new string('b', 300 * 1024) + "{{*/.x}}");
            Assert.EndsWith("bX", await Mix("/big.html"));
        }

        [Fact]
        public async Task ManyFiles_AreAllServedCorrectly()
        {
            for (var idx = 0; idx < 300; idx++)
                File.WriteAllText(Path.Combine(_dir, $"p{idx}.html"), $"<p>{idx} {{{{*/.x}}}}</p>");
            for (var round = 0; round < 2; round++)
            {
                for (var idx = 0; idx < 300; idx++)
                    Assert.Equal($"<p>{idx} X</p>", await Mix($"/p{idx}.html"));
            }
        }
    }
}
