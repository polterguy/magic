/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using Newtonsoft.Json.Linq;
using magic.http.services;
using magic.http.contracts;
using magic.common.contracts;

namespace magic.http.tests
{
    public class HttpClientTests
    {
        #region [ -- Unit tests -- ]

        [Fact]
        public async void GetString()
        {
            var kernel = Initialize();
            var client = kernel.GetService(typeof(IHttpClient)) as IHttpClient;
            var result = await client.GetAsync<string>("https://my-json-server.typicode.com/typicode/demo/posts");
            Assert.NotNull(result);
        }

        [Fact]
        public async void GetJArray()
        {
            var kernel = Initialize();
            var client = kernel.GetService(typeof(IHttpClient)) as IHttpClient;
            var result = await client.GetAsync<JArray>("https://my-json-server.typicode.com/typicode/demo/posts");
            Assert.NotNull(result);
            Assert.Equal(3, result.Count);
        }

        [Fact]
        public async void GetObject()
        {
            var kernel = Initialize();
            var client = kernel.GetService(typeof(IHttpClient)) as IHttpClient;
            var result = await client.GetAsync<Blog[]>("https://my-json-server.typicode.com/typicode/demo/posts");
            Assert.NotNull(result);
            Assert.Equal(3, result.Length);
        }

        [Fact]
        public async void GetEnumerable()
        {
            var kernel = Initialize();
            var client = kernel.GetService(typeof(IHttpClient)) as IHttpClient;
            var result = await client.GetAsync<IEnumerable<Blog>>("https://my-json-server.typicode.com/typicode/demo/posts");
            Assert.NotNull(result);
            Assert.Equal(3, result.Count());
        }

        [Fact]
        public async void PostObject()
        {
            var kernel = Initialize();
            var client = kernel.GetService(typeof(IHttpClient)) as IHttpClient;
            var user = new User
            {
                Name = "John Doe"
            };
            var result = await client.PostAsync<User, UserWithId>(
                "https://my-json-server.typicode.com/typicode/demo/posts",
                user);
            Assert.Equal("John Doe", result.Name);
            Assert.True(result.Id > 0);
        }

        [Fact]
        public async void PostStream()
        {
            var kernel = Initialize();
            var client = kernel.GetService(typeof(IHttpClient)) as IHttpClient;
            Blog[] blogs = null;
            await client.GetAsync(
                "https://my-json-server.typicode.com/typicode/demo/posts",
                (stream) =>
                {
                    using (var memory = new MemoryStream())
                    {
                        stream.CopyTo(memory);
                        memory.Position = 0;
                        using (var reader = new StreamReader(memory))
                        {
                            var stringContent = reader.ReadToEnd();
                            blogs = JArray.Parse(stringContent).ToObject<Blog[]>();
                        }
                    }
                });
            Assert.Equal(3, blogs.Length);
        }

        [Fact]
        public async void GetStream()
        {
            var kernel = Initialize();
            var client = kernel.GetService(typeof(IHttpClient)) as IHttpClient;
            using (var stream = new MemoryStream())
            {
                var jObject = JObject.FromObject(new User
                {
                    Name = "John Doe"
                });
                using (var writer = new StreamWriter(stream))
                {
                    writer.Write (jObject.ToString());
                    writer.Flush();
                    stream.Position = 0;
                    var result = await client.PostAsync<Stream, UserWithId>(
                        "https://my-json-server.typicode.com/typicode/demo/posts",
                        stream);
                    Assert.Equal("John Doe", result.Name);
                    Assert.True(result.Id > 0);
                }
            }
        }

        #endregion

        #region [ -- Private helper methods and types -- ]

        class Blog
        {
            public int Id { get; set; }

            public string Title { get; set; }
        }

        class User
        {
            public string Name { get; set; }
        }

        class UserWithId
        {
            public int Id { get; set; }

            public string Name { get; set; }
        }

        IServiceProvider Initialize()
        {
            var configuration = new ConfigurationBuilder().Build();
            var kernel = new ServiceCollection();
            kernel.AddTransient<IConfiguration>((svc) => configuration);
            kernel.AddTransient<IHttpClient, HttpClient>();
            var provider = kernel.BuildServiceProvider();
            foreach (var idx in InstantiateAllTypes<IStartup>())
            {
                idx.Initialize(provider, configuration);
            }
            return provider;
        }

        static IEnumerable<T> InstantiateAllTypes<T>() where T : class
        {
            var type = typeof(T);
            var types = AppDomain.CurrentDomain.GetAssemblies()
                .SelectMany(s => s.GetTypes())
                .Where(p => type.IsAssignableFrom(p) && !p.IsInterface && !p.IsAbstract);

            foreach (var idx in types)
            {
                var instance = Activator.CreateInstance(idx) as T;
                yield return instance;
            }
        }

        #endregion
    }
}
