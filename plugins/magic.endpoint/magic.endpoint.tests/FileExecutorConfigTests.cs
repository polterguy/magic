/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Collections.Concurrent;
using Xunit;
using magic.node.contracts;
using magic.node.services;
using magic.signals.services;
using magic.endpoint.services;
using magic.endpoint.contracts.poco;

namespace magic.endpoint.tests
{
    /*
     * Tests for how the file executor uses "/etc/www/.config", which is read and parsed again only when the file changes,
     * and which must never change what a request gets, only how often the file is read.
     */
    public class FileExecutorConfigTests : IDisposable
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

        // The real file service, counting how often each file is loaded. Optionally pretends it cannot tell if a file has changed.
        class CountingFiles : IFileService, IFileStamps
        {
            readonly FileService _inner = new();
            public ConcurrentDictionary<string, int> Loads { get; } = new();
            public FileStamp? GetStamp(string path) => _inner.GetStamp(path);
            public Task<bool> ExistsAsync(string p) => _inner.ExistsAsync(p);
            public Task DeleteAsync(string p) => _inner.DeleteAsync(p);
            public Task CopyAsync(string s, string d) => _inner.CopyAsync(s, d);
            public Task MoveAsync(string s, string d) => _inner.MoveAsync(s, d);
            public Task<string> LoadAsync(string p) { Loads.AddOrUpdate(p, 1, (_, c) => c + 1); return _inner.LoadAsync(p); }
            public Task<IEnumerable<(string Filename, byte[] Content)>> LoadAllAsync(string f, string e) => _inner.LoadAllAsync(f, e);
            public Task<byte[]> LoadBinaryAsync(string p) => _inner.LoadBinaryAsync(p);
            public Task SaveAsync(string p, string c) => _inner.SaveAsync(p, c);
            public Task SaveAsync(string p, byte[] c) => _inner.SaveAsync(p, c);
            public List<string> List(string f, string e = null) => _inner.List(f, e);
            public List<string> ListAll(string f, string e = null) => _inner.ListAll(f, e);
        }

        class CountingFilesWithoutStamps : IFileService
        {
            readonly CountingFiles _inner = new();
            public int ConfigLoads => _inner.Loads.Where(x => x.Key.EndsWith(".config")).Sum(x => x.Value);
            public Task<bool> ExistsAsync(string p) => _inner.ExistsAsync(p);
            public Task DeleteAsync(string p) => _inner.DeleteAsync(p);
            public Task CopyAsync(string s, string d) => _inner.CopyAsync(s, d);
            public Task MoveAsync(string s, string d) => _inner.MoveAsync(s, d);
            public Task<string> LoadAsync(string p) => _inner.LoadAsync(p);
            public Task<IEnumerable<(string Filename, byte[] Content)>> LoadAllAsync(string f, string e) => _inner.LoadAllAsync(f, e);
            public Task<byte[]> LoadBinaryAsync(string p) => _inner.LoadBinaryAsync(p);
            public Task SaveAsync(string p, string c) => _inner.SaveAsync(p, c);
            public Task SaveAsync(string p, byte[] c) => _inner.SaveAsync(p, c);
            public List<string> List(string f, string e = null) => _inner.List(f, e);
            public List<string> ListAll(string f, string e = null) => _inner.ListAll(f, e);
        }

        readonly string _dir = Path.Combine(Path.GetTempPath(), "file-executor-" + Guid.NewGuid().ToString("N"));
        string Www => Path.Combine(_dir, "etc", "www");
        string ConfigPath => Path.Combine(Www, ".config");

        public FileExecutorConfigTests()
        {
            Directory.CreateDirectory(Www);
            File.WriteAllText(Path.Combine(Www, "a.css"), "body { color: red; }");
            File.WriteAllText(Path.Combine(Www, "index.html"), "<p>index</p>");
            File.WriteAllText(Path.Combine(Www, "about.html"), "<p>about</p>");
        }

        public void Dispose()
        {
            Directory.Delete(_dir, true);
        }

        HttpFileExecutorAsync Create(IFileService files) => new HttpFileExecutorAsync(
            new Signaler(null, null), files, new StreamService(files), new Root(_dir), new HttpArgumentsHandler(), new ExecutionRegistry());

        static MagicRequest Request(string url) => new MagicRequest
        {
            URL = url, Verb = "get", Query = new(), Headers = new(), Cookies = new(), Host = "localhost", Scheme = "http",
        };

        // Replaces the file in one step, such that a request is never handed a half written config.
        void WriteConfig(string text, int secondsInTheFuture = 0)
        {
            var temporary = Path.Combine(Www, ".config." + Guid.NewGuid().ToString("N"));
            File.WriteAllText(temporary, text);
            if (secondsInTheFuture != 0)
                File.SetLastWriteTimeUtc(temporary, DateTime.UtcNow.AddSeconds(secondsInTheFuture));
            File.Move(temporary, ConfigPath, true);
        }

        static string Config(string cacheControl) => $"static_files\n   headers\n      *\n         Cache-Control:{cacheControl}\n      css\n         Content-Type:text/css\nspa_enabled:false\n";

        static async Task<MagicResponse> Get(HttpFileExecutorAsync executor, string url)
        {
            var response = await executor.ExecuteAsync(Request(url));
            (response.Content as IDisposable)?.Dispose();
            return response;
        }

        [Fact]
        public async Task StaticFile_GetsItsHeadersFromTheConfig()
        {
            WriteConfig(Config("public, max-age=60"));
            var response = await Get(Create(new CountingFiles()), "a.css");
            Assert.Equal(200, response.Result);
            Assert.Equal("public, max-age=60", response.Headers["Cache-Control"]);
            Assert.Equal("text/css", response.Headers["Content-Type"]);
        }

        [Fact]
        public async Task EditedConfig_IsPickedUp_EvenWhenTheSizeIsTheSame()
        {
            WriteConfig(Config("public, max-age=60"));
            var executor = Create(new CountingFiles());
            Assert.Equal("public, max-age=60", (await Get(executor, "a.css")).Headers["Cache-Control"]);
            Assert.Equal("public, max-age=60", (await Get(executor, "a.css")).Headers["Cache-Control"]);

            WriteConfig(Config("public, max-age=61"), 5);
            Assert.Equal("public, max-age=61", (await Get(executor, "a.css")).Headers["Cache-Control"]);
        }

        [Fact]
        public async Task DeletedConfig_MeansNoConfiguredHeaders()
        {
            WriteConfig(Config("public, max-age=60"));
            var executor = Create(new CountingFiles());
            Assert.True((await Get(executor, "a.css")).Headers.ContainsKey("Cache-Control"));
            File.Delete(ConfigPath);
            var response = await Get(executor, "a.css");
            Assert.Equal(200, response.Result);
            Assert.False(response.Headers.ContainsKey("Cache-Control"));
            Assert.Equal("text/css", response.Headers["Content-Type"]); // The built-in mapping, not the config's
        }

        [Fact]
        public async Task ConfigCreatedAfterwards_IsPickedUp()
        {
            var executor = Create(new CountingFiles());
            Assert.False((await Get(executor, "a.css")).Headers.ContainsKey("Cache-Control"));
            WriteConfig(Config("public, max-age=60"));
            Assert.Equal("public, max-age=60", (await Get(executor, "a.css")).Headers["Cache-Control"]);
        }

        [Fact]
        public async Task ConfigIsLoadedOnce_ForManyRequests_AndAgainAfterAnEdit()
        {
            WriteConfig(Config("public, max-age=60"));
            var files = new CountingFiles();
            var executor = Create(files);
            for (var idx = 0; idx < 50; idx++)
            {
                Assert.Equal(200, (await Get(executor, "a.css")).Result);
                Assert.Equal(200, (await Get(executor, "about")).Result);
            }
            Assert.Equal(1, files.Loads.Where(x => x.Key.EndsWith(".config")).Sum(x => x.Value));

            WriteConfig(Config("public, max-age=61"), 5);
            Assert.Equal(200, (await Get(executor, "a.css")).Result);
            Assert.Equal(2, files.Loads.Where(x => x.Key.EndsWith(".config")).Sum(x => x.Value));
        }

        [Fact]
        public async Task FileServiceWithoutStamps_StillWorks_AndReadsTheConfigEveryTime()
        {
            WriteConfig(Config("public, max-age=60"));
            var files = new CountingFilesWithoutStamps();
            var executor = Create(files);
            Assert.Equal("public, max-age=60", (await Get(executor, "a.css")).Headers["Cache-Control"]);
            WriteConfig(Config("public, max-age=61"));
            Assert.Equal("public, max-age=61", (await Get(executor, "a.css")).Headers["Cache-Control"]);
            Assert.True(files.ConfigLoads >= 2);
        }

        [Fact]
        public async Task Redirects_FollowTheConfig()
        {
            WriteConfig("redirect\n   .\n      from:old\n      to:/new\nspa_enabled:false\n");
            var executor = Create(new CountingFiles());
            var response = await Get(executor, "old");
            Assert.Equal(301, response.Result);
            Assert.Equal("/new", response.Headers["Location"]);

            WriteConfig("redirect\n   .\n      from:old\n      to:/newer\nspa_enabled:false\n", 5);
            Assert.Equal("/newer", (await Get(executor, "old")).Headers["Location"]);
        }

        [Fact]
        public async Task SpaMode_ServesTheIndexForUnknownUrls_AndFollowsTheConfig()
        {
            WriteConfig("spa_enabled:true\n");
            var executor = Create(new CountingFiles());
            Assert.Equal(200, (await Get(executor, "some/route")).Result);

            WriteConfig("spa_enabled:false\n", 5);
            Assert.Equal(404, (await Get(executor, "some/route")).Result);
        }

        [Fact]
        public async Task ConcurrentRequests_WhileTheConfigChanges_AreAlwaysServed()
        {
            WriteConfig(Config("public, max-age=60"));
            var files = new CountingFiles();
            var tasks = Enumerable.Range(0, 200).Select(idx => Task.Run(async () =>
            {
                if (idx == 100)
                    WriteConfig(Config("public, max-age=99"), 5);
                var response = await Get(Create(files), "a.css");
                Assert.Equal(200, response.Result);
                Assert.StartsWith("public, max-age=", response.Headers["Cache-Control"]);
            }));
            await Task.WhenAll(tasks);
            Assert.Equal("public, max-age=99", (await Get(Create(files), "a.css")).Headers["Cache-Control"]);
        }
    }
}
