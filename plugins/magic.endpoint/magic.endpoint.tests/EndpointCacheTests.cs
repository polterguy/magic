/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using Newtonsoft.Json.Linq;
using magic.node.contracts;
using magic.signals.contracts;
using magic.endpoint.services;
using magic.endpoint.contracts;
using magic.endpoint.contracts.poco;
using magic.node.extensions.hyperlambda;

namespace magic.endpoint.tests
{
    /*
     * Tests for the cache of parsed endpoints, which must never change what an endpoint does, only how often its files are parsed.
     */
    public class EndpointCacheTests : IDisposable
    {
        // Every test uses its own folder, since the cache is shared by every executor in the process.
        readonly string _name = "cache-tests-" + Guid.NewGuid().ToString("N");
        readonly string _folder;

        public EndpointCacheTests()
        {
            _folder = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "modules", _name);
            Directory.CreateDirectory(_folder);

            // These tests edit files and expect the very next request to notice, so nothing is trusted without checking.
            HttpApiExecutorAsync.RecheckMilliseconds = 0;
        }

        public void Dispose()
        {
            HttpApiExecutorAsync.RecheckMilliseconds = 0;
            Directory.Delete(_folder, true);
        }

        #region [ -- Edits, deletions and interceptors -- ]

        [Fact]
        public async Task EditOfEndpoint_IsOnlyPickedUpAfterTheRecheckTime()
        {
            Write("hello.get.hl", "return-nodes\n   result:first\n");
            var executor = CreateExecutor();
            try
            {
                HttpApiExecutorAsync.RecheckMilliseconds = 600000;
                Assert.Equal("first", (await Get(executor, "hello"))["result"].Value<string>());

                // The second request is the first to find the files unchanged, which starts the clock.
                Assert.Equal("first", (await Get(executor, "hello"))["result"].Value<string>());
                Write("hello.get.hl", "return-nodes\n   result:second\n", 5);
                Assert.Equal("first", (await Get(executor, "hello"))["result"].Value<string>());

                HttpApiExecutorAsync.RecheckMilliseconds = 0;
                Assert.Equal("second", (await Get(executor, "hello"))["result"].Value<string>());
            }
            finally
            {
                HttpApiExecutorAsync.RecheckMilliseconds = 0;
            }
        }

        [Fact]
        public async Task EditOfEndpoint_IsPickedUp_EvenWhenTheSizeIsTheSame()
        {
            Write("hello.get.hl", "return-nodes\n   result:first\n");
            var executor = CreateExecutor();
            Assert.Equal("first", (await Get(executor, "hello"))["result"].Value<string>());
            Assert.Equal("first", (await Get(executor, "hello"))["result"].Value<string>());

            // Same length, so only the time of the write tells the two versions apart.
            Write("hello.get.hl", "return-nodes\n   result:fifth\n", 5);
            Assert.Equal("fifth", (await Get(executor, "hello"))["result"].Value<string>());
        }

        [Fact]
        public async Task EditOfEndpoint_ToADifferentSize_IsPickedUp()
        {
            Write("hello.get.hl", "return-nodes\n   result:short\n");
            var executor = CreateExecutor();
            Assert.Equal("short", (await Get(executor, "hello"))["result"].Value<string>());
            Write("hello.get.hl", "return-nodes\n   result:a much longer value\n");
            Assert.Equal("a much longer value", (await Get(executor, "hello"))["result"].Value<string>());
        }

        [Fact]
        public async Task DeletedEndpoint_Returns404_AfterBeingCached()
        {
            Write("hello.get.hl", "return-nodes\n   result:first\n");
            var executor = CreateExecutor();
            Assert.Equal(200, (await executor.ExecuteAsync(Request("hello"))).Result);
            Assert.Equal(200, (await executor.ExecuteAsync(Request("hello"))).Result);
            File.Delete(Path.Combine(_folder, "hello.get.hl"));
            Assert.Equal(404, (await executor.ExecuteAsync(Request("hello"))).Result);
        }

        [Fact]
        public async Task RequestsForMissingEndpoints_DoNotGrowTheCache()
        {
            var executor = CreateExecutor();
            var before = CacheSize();
            for (var idx = 0; idx < 200; idx++)
            {
                Assert.Equal(404, (await CreateExecutor().ExecuteAsync(Request("nothing-here-" + idx))).Result);
            }
            Assert.Equal(before, CacheSize());
        }

        [Fact]
        public async Task DeletedEndpoint_IsRemovedFromTheCache()
        {
            Write("hello.get.hl", "return-nodes\n   result:first\n");
            var executor = CreateExecutor();
            var before = CacheSize();
            Assert.Equal(200, (await executor.ExecuteAsync(Request("hello"))).Result);
            Assert.Equal(before + 1, CacheSize());
            File.Delete(Path.Combine(_folder, "hello.get.hl"));
            Assert.Equal(404, (await executor.ExecuteAsync(Request("hello"))).Result);
            Assert.Equal(before, CacheSize());
        }

        [Fact]
        public async Task DeletedFolder_Returns404_AfterBeingCached()
        {
            Directory.CreateDirectory(Path.Combine(_folder, "sub"));
            Write("sub/hello.get.hl", "return-nodes\n   result:first\n");
            var executor = CreateExecutor();
            Assert.Equal(200, (await executor.ExecuteAsync(Request("sub/hello"))).Result);
            Assert.Equal(200, (await executor.ExecuteAsync(Request("sub/hello"))).Result);
            Directory.Delete(Path.Combine(_folder, "sub"), true);
            Assert.Equal(404, (await executor.ExecuteAsync(Request("sub/hello"))).Result);
        }

        [Fact]
        public async Task EndpointCreatedAfterA404_IsFound()
        {
            var executor = CreateExecutor();
            Assert.Equal(404, (await executor.ExecuteAsync(Request("later"))).Result);
            Write("later.get.hl", "return-nodes\n   result:here\n");
            Assert.Equal("here", (await Get(executor, "later"))["result"].Value<string>());
        }

        [Fact]
        public async Task Interceptor_AddedEditedAndRemoved_IsPickedUp()
        {
            Write("foo.get.hl", ".endpoint-value:world\nresponse.headers.set\n   Content-Type:application/x-hyperlambda\nadd:x:../*/return\n   get-nodes:x:../*\nreturn\n");
            var executor = CreateExecutor();
            Assert.Equal(".endpoint-value", await FirstNode(executor, "foo"));
            Assert.Equal(".endpoint-value", await FirstNode(executor, "foo"));

            Write("interceptor.hl", ".interceptor-value:howdy\n.interceptor\n");
            Assert.Equal(".interceptor-value", await FirstNode(executor, "foo"));

            Write("interceptor.hl", ".other-value:howdy\n.interceptor\n", 5);
            Assert.Equal(".other-value", await FirstNode(executor, "foo"));

            File.Delete(Path.Combine(_folder, "interceptor.hl"));
            Assert.Equal(".endpoint-value", await FirstNode(executor, "foo"));
        }

        #endregion

        #region [ -- Requests must never affect each other -- ]

        [Fact]
        public async Task Arguments_DoNotLeakBetweenRequests()
        {
            Write("echo.get.hl", ".arguments\n   name:string\nunwrap:x:+/*\nreturn-nodes\n   name:x:@.arguments/*/name\n");
            var executor = CreateExecutor();
            foreach (var idx in new[] { "first", "second", "third", "first" })
            {
                var result = await Get(executor, "echo", new Dictionary<string, string> { { "name", idx } });
                Assert.Equal(idx, result["name"].Value<string>());
            }
        }

        [Fact]
        public async Task EndpointChangingItsOwnLambda_DoesNotAffectTheNextRequest()
        {
            Write("mutate.get.hl", ".v:original\n.before\nset-value:x:@.before\n   get-value:x:@.v\nset-value:x:@.v\n   .:mutated\nunwrap:x:+/*\nreturn-nodes\n   before:x:@.before\n");
            var executor = CreateExecutor();
            for (var idx = 0; idx < 5; idx++)
            {
                Assert.Equal("original", (await Get(executor, "mutate"))["before"].Value<string>());
            }
        }

        [Fact]
        public async Task ConcurrentRequestsWithDifferentArguments_GetTheirOwnAnswers()
        {
            Write("echo.get.hl", ".arguments\n   name:string\nunwrap:x:+/*\nreturn-nodes\n   name:x:@.arguments/*/name\n");
            var results = await Task.WhenAll(Enumerable.Range(0, 200).Select(idx => Task.Run(async () =>
            {
                var result = await Get(CreateExecutor(), "echo", new Dictionary<string, string> { { "name", "n" + idx } });
                return (Expected: "n" + idx, Actual: result["name"].Value<string>());
            })));
            Assert.All(results, x => Assert.Equal(x.Expected, x.Actual));
        }

        #endregion

        #region [ -- Only one thread creates an endpoint -- ]

        [Fact]
        public async Task ManyConcurrentRequestsToANewEndpoint_LoadItsFileExactlyOnce()
        {
            Write("hello.get.hl", "return-nodes\n   result:hello world\n");
            var files = new CountingFileServiceWithStamps();

            // Every request gets its own executor and signaler, exactly as in the web server, sharing only the file service.
            var statuses = await Task.WhenAll(Enumerable.Range(0, 100).Select(_ => Task.Run(async () =>
                (await CreateExecutor(files).ExecuteAsync(Request("hello"))).Result)));
            Assert.All(statuses, x => Assert.Equal(200, x));
            Assert.Equal(1, files.LoadsOf("hello.get.hl"));

            // And later requests keep using what was created.
            for (var idx = 0; idx < 20; idx++)
            {
                Assert.Equal(200, (await CreateExecutor(files).ExecuteAsync(Request("hello"))).Result);
            }
            Assert.Equal(1, files.LoadsOf("hello.get.hl"));
        }

        [Fact]
        public async Task ConcurrentRequestsToDifferentEndpoints_DoNotWaitForEachOther()
        {
            for (var idx = 0; idx < 20; idx++)
            {
                Write($"e{idx}.get.hl", $"return-nodes\n   result:e{idx}\n");
            }
            var files = new CountingFileServiceWithStamps();
            var results = await Task.WhenAll(Enumerable.Range(0, 200).Select(idx => Task.Run(async () =>
            {
                var result = await Get(CreateExecutor(files), "e" + idx % 20);
                return (Expected: "e" + idx % 20, Actual: result["result"].Value<string>());
            })));
            Assert.All(results, x => Assert.Equal(x.Expected, x.Actual));
            for (var idx = 0; idx < 20; idx++)
            {
                Assert.Equal(1, files.LoadsOf($"e{idx}.get.hl"));
            }
        }

        [Fact]
        public async Task FileServiceWithoutStamps_NeverCaches()
        {
            Write("hello.get.hl", "return-nodes\n   result:hello world\n");
            var files = new CountingFileService();
            var executor = CreateExecutor(files);
            for (var idx = 0; idx < 5; idx++)
            {
                Assert.Equal(200, (await executor.ExecuteAsync(Request("hello"))).Result);
            }
            Assert.Equal(5, files.LoadsOf("hello.get.hl"));
        }

        [Fact]
        public async Task EndpointThatFailsToParse_IsNotCached_AndRecoversWhenFixed()
        {
            Write("broken.get.hl", "return-nodes\n      result:too many spaces\n");
            var executor = CreateExecutor();
            await Assert.ThrowsAnyAsync<Exception>(() => executor.ExecuteAsync(Request("broken")));
            await Assert.ThrowsAnyAsync<Exception>(() => executor.ExecuteAsync(Request("broken")));
            Write("broken.get.hl", "return-nodes\n   result:fixed\n", 5);
            Assert.Equal("fixed", (await Get(executor, "broken"))["result"].Value<string>());
        }

        #endregion

        #region [ -- Helpers -- ]

        // The number of cached endpoints, which the executor deliberately keeps private.
        static int CacheSize()
        {
            var field = typeof(HttpApiExecutorAsync).GetField("_cache", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
            return ((System.Collections.ICollection)field.GetValue(null)).Count;
        }

        void Write(string file, string content, int secondsAhead = 0)
        {
            var path = Path.Combine(_folder, file);
            File.WriteAllText(path, content);

            // Some file systems have a coarse clock, so tests that expect a second edit to be noticed push the time forward.
            if (secondsAhead > 0)
                File.SetLastWriteTimeUtc(path, File.GetLastWriteTimeUtc(path).AddSeconds(secondsAhead));
        }

        MagicRequest Request(string endpoint, Dictionary<string, string> query = null)
        {
            return new MagicRequest
            {
                URL = $"magic/modules/{_name}/{endpoint}",
                Verb = "get",
                Query = query ?? new Dictionary<string, string>(),
                Headers = new Dictionary<string, string>(),
                Cookies = new Dictionary<string, string>(),
                Host = "localhost",
                Scheme = "http"
            };
        }

        async Task<JObject> Get(IHttpExecutorAsync executor, string endpoint, Dictionary<string, string> query = null)
        {
            var response = await executor.ExecuteAsync(Request(endpoint, query));
            Assert.Equal(200, response.Result);
            return JObject.Parse(response.Content.ToString());
        }

        async Task<string> FirstNode(IHttpExecutorAsync executor, string endpoint)
        {
            var response = await executor.ExecuteAsync(Request(endpoint));
            Assert.Equal(200, response.Result);
            return HyperlambdaParser.Parse(Assert.IsType<string>(response.Content)).Children.First().Name;
        }

        static IHttpExecutorAsync CreateExecutor(IFileService files = null)
        {
            var services = Common.Initialize();
            if (files == null)
                return services.GetService(typeof(IHttpExecutorAsync)) as IHttpExecutorAsync;
            return new HttpApiExecutorAsync(
                services.GetService<ISignaler>(),
                files,
                services.GetService<IRootResolver>(),
                services.GetService<IHttpArgumentsHandler>(),
                services.GetService<IExecutionRegistry>());
        }

        /*
         * A real file service that counts how many times each file is loaded. The subclass below also offers file stamps.
         */
        class CountingFileService : IFileService
        {
            protected readonly magic.node.services.FileService _inner = new magic.node.services.FileService();
            readonly Dictionary<string, int> _loads = new Dictionary<string, int>();

            public int LoadsOf(string filename)
            {
                lock (_loads)
                    return _loads.Where(x => x.Key.EndsWith(filename)).Sum(x => x.Value);
            }

            public Task<string> LoadAsync(string path)
            {
                lock (_loads)
                    _loads[path] = _loads.GetValueOrDefault(path) + 1;
                return _inner.LoadAsync(path);
            }

            public Task<bool> ExistsAsync(string path) => _inner.ExistsAsync(path);
            public Task DeleteAsync(string path) => _inner.DeleteAsync(path);
            public Task CopyAsync(string source, string destination) => _inner.CopyAsync(source, destination);
            public Task MoveAsync(string source, string destination) => _inner.MoveAsync(source, destination);
            public Task<IEnumerable<(string Filename, byte[] Content)>> LoadAllAsync(string folder, string extension) => _inner.LoadAllAsync(folder, extension);
            public Task<byte[]> LoadBinaryAsync(string path) => _inner.LoadBinaryAsync(path);
            public Task SaveAsync(string path, string content) => _inner.SaveAsync(path, content);
            public Task SaveAsync(string path, byte[] content) => _inner.SaveAsync(path, content);
            public List<string> List(string folder, string extension = null) => _inner.List(folder, extension);
            public List<string> ListAll(string folder, string extension = null) => _inner.ListAll(folder, extension);
        }

        class CountingFileServiceWithStamps : CountingFileService, IFileStamps
        {
            public FileStamp? GetStamp(string path) => _inner.GetStamp(path);
        }

        #endregion
    }
}
