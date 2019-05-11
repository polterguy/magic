/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using System.Collections.Generic;
using Microsoft.Extensions.Configuration;
using Xunit;
using Ninject;
using Newtonsoft.Json.Linq;
using magic.common.contracts;
using magic.http.contracts;

namespace magic.http.tests
{
    public class HttpClientTests
    {
        #region [ -- Unit tests -- ]

        [Fact]
        public async void GetString()
        {
            var kernel = Initialize();
            var client = kernel.Get<IHttpClient>();
            var result = await client.GetAsync<string>("https://my-json-server.typicode.com/typicode/demo/posts");
            Assert.NotNull(result);
        }

        [Fact]
        public async void GetJArray()
        {
            var kernel = Initialize();
            var client = kernel.Get<IHttpClient>();
            var result = await client.GetAsync<JArray>("https://my-json-server.typicode.com/typicode/demo/posts");
            Assert.NotNull(result);
            Assert.Equal(3, result.Count);
        }

        [Fact]
        public async void GetObject()
        {
            var kernel = Initialize();
            var client = kernel.Get<IHttpClient>();
            var result = await client.GetAsync<Blog[]>("https://my-json-server.typicode.com/typicode/demo/posts");
            Assert.NotNull(result);
            Assert.Equal(3, result.Length);
        }

        [Fact]
        public async void GetEnumerable()
        {
            var kernel = Initialize();
            var client = kernel.Get<IHttpClient>();
            var result = await client.GetAsync<IEnumerable<Blog>>("https://my-json-server.typicode.com/typicode/demo/posts");
            Assert.NotNull(result);
            Assert.Equal(3, result.Count());
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

        [Fact]
        public async void PostObject()
        {
            var kernel = Initialize();
            var client = kernel.Get<IHttpClient>();
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

        #endregion

        #region [ -- Private helper methods and types -- ]

        class Blog
        {
            public int Id { get; set; }

            public string Title { get; set; }
        }

        IKernel Initialize()
        {
            var configuration = new ConfigurationBuilder().Build();
            var kernel = new StandardKernel();
            foreach (var idx in InstantiateAllTypes<IStartup>())
            {
                idx.Configure(kernel, configuration);
            }
            return kernel;
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
