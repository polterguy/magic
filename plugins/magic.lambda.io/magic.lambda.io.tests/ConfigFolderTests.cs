/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System;
using System.IO;
using System.Linq;
using Xunit;
using magic.node.extensions;
using magic.lambda.io.tests.helpers;

namespace magic.lambda.io.tests
{
    /*
     * The configuration folder carries the server's secrets, so code inside a [whitelist] can never read it, however
     * its vocabulary is pinned or not, while the code that runs without a whitelist, which is trusted, still can.
     */
    public class ConfigFolderTests
    {
        static readonly string Root = AppDomain.CurrentDomain.BaseDirectory;

        static string Call(string slot, string path) =>
            slot == "io.file.search" ? $"{slot}:{path}\n         pattern:foo" : $"{slot}:{path}";

        // An unpinned vocabulary entry, which grants the slot for every path.
        static string Whitelisted(string slot, string path) => $@"
whitelist
   vocabulary
      {slot}
   .lambda
      {Call(slot, path)}";

        static (FileService File, FolderService Folder, StreamService Stream) Services(Action reached)
        {
            var file = new FileService
            {
                ExistsAction = path => { reached(); return true; },
                LoadAction = path => { reached(); return "secret"; },
                LoadBinaryAction = path => { reached(); return [1]; },
                ListFilesAction = path => { reached(); return []; },
                ListFilesRecursivelyAction = (path, ext) => { reached(); return []; },
                LoadRecursivelyAction = (path, ext) => { reached(); return []; },
            };
            var folder = new FolderService
            {
                ExistsAction = path => { reached(); return true; },
                ListAction = path => { reached(); return []; },
                ListFoldersRecursivelyAction = path => { reached(); return []; },
                ListFoldersRecursivelyAsyncAction = path => { reached(); return []; },
            };
            var stream = new StreamService
            {
                OpenFileAction = path => { reached(); return Stream.Null; },
                ExistsAction = path => { reached(); return true; },
            };
            return (file, folder, stream);
        }

        [Theory]
        [InlineData("io.file.load", "/config/appsettings.json")]
        [InlineData("io.file.load.binary", "/config/appsettings.json")]
        [InlineData("io.file.exists", "/config/appsettings.json")]
        [InlineData("io.file.mixin", "/config/index.html")]
        [InlineData("io.stream.open-file", "/config/appsettings.json")]
        [InlineData("io.file.list", "/config/")]
        [InlineData("io.file.list-recursively", "/config/")]
        [InlineData("io.file.load-recursively", "/config/")]
        [InlineData("io.file.search", "/config/")]
        [InlineData("io.folder.exists", "/config/")]
        [InlineData("io.folder.exists", "/config")]
        [InlineData("io.folder.list", "/config/")]
        [InlineData("io.folder.list-recursively", "/config/")]
        public void ReadingSlotRefusesConfigFolderInsideWhitelist(string slot, string path)
        {
            var reached = false;
            var (file, folder, stream) = Services(() => reached = true);

            var exception = Assert.Throws<HyperlambdaException>(
                () => Common.Evaluate(Whitelisted(slot, path), file, folder, stream));

            Assert.Equal($"Slot [{slot}] is not allowed to read the configuration folder in current scope", exception.Message);
            Assert.False(reached);
        }

        [Theory]
        [InlineData("/config/appsettings.json")]
        [InlineData("/config/sub/folder/secret.txt")]
        [InlineData("/Config/appsettings.json")]
        [InlineData("/CONFIG/appsettings.json")]
        [InlineData("/./config/appsettings.json")]
        [InlineData("//config/appsettings.json")]
        public void ConfigFolderIsRefusedHoweverThePathIsSpelled(string path)
        {
            var reached = false;
            var (file, folder, stream) = Services(() => reached = true);

            Assert.Throws<HyperlambdaException>(
                () => Common.Evaluate(Whitelisted("io.file.load", path), file, folder, stream));

            Assert.False(reached);
        }

        [Fact]
        public void ConfigFolderIsStillReadableWithoutWhitelist()
        {
            var (file, folder, stream) = Services(() => { });

            var lambda = Common.Evaluate("io.file.load:/config/appsettings.json", file, folder, stream);

            Assert.Equal("secret", lambda.Children.First().Value);
        }

        [Theory]
        [InlineData("/configuration/appsettings.json")]
        [InlineData("/config-old/appsettings.json")]
        [InlineData("/etc/config/appsettings.json")]
        public void FolderMerelyStartingLikeConfigIsNotRefused(string path)
        {
            var (file, folder, stream) = Services(() => { });

            var lambda = Common.Evaluate($@"
whitelist
   vocabulary
      io.file.load
      return-value
   .lambda
      io.file.load:{path}
      return-value:x:@io.file.load", file, folder, stream);

            Assert.Equal("secret", lambda.Children.First().Value);
        }

        [Fact]
        public void ListingAboveConfigLeavesItOut()
        {
            var (file, folder, stream) = Services(() => { });
            file.ListFilesRecursivelyAction = (path, ext) => [Root + "config/appsettings.json", Root + "etc/a.txt"];

            var lambda = Common.Evaluate(@"
whitelist
   vocabulary
      io.file.list-recursively
      return-nodes
   .lambda
      io.file.list-recursively:/
      return-nodes:x:@io.file.list-recursively/*", file, folder, stream);

            Assert.Equal("/etc/a.txt", lambda.Children.First().Children.Single().Value);
        }

        [Fact]
        public void ListingFoldersAboveConfigLeavesItOut()
        {
            var (file, folder, stream) = Services(() => { });
            folder.ListAction = path => [Root + "config", Root + "etc"];

            var lambda = Common.Evaluate(@"
whitelist
   vocabulary
      io.folder.list
      return-nodes
   .lambda
      io.folder.list:/
      return-nodes:x:@io.folder.list/*", file, folder, stream);

            Assert.Equal("/etc", lambda.Children.First().Children.Single().Value);
        }

        [Fact]
        public void RecursiveLoadAboveConfigLeavesItOut()
        {
            var (file, folder, stream) = Services(() => { });
            file.LoadRecursivelyAction = (path, ext) =>
                [(Root + "config/appsettings.json", new byte[] { 1 }), (Root + "etc/a.txt", new byte[] { 2 })];

            var lambda = Common.Evaluate(@"
whitelist
   vocabulary
      io.file.load-recursively
      return-nodes
   .lambda
      io.file.load-recursively:/
      return-nodes:x:@io.file.load-recursively/*", file, folder, stream);

            var entry = lambda.Children.First().Children.Single();
            Assert.Equal("/etc/a.txt", entry.Children.First(x => x.Name == "name").Value);
        }
    }
}
