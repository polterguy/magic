/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Threading.Tasks;
using Xunit;
using magic.node;
using magic.node.extensions;

namespace magic.lambda.caching.tests
{
    public class CachingTests
    {
        [Fact]
        public void CacheSetGet()
        {
            var lambda = Common.Evaluate(@"
cache.set:foo
   expiration:5
   value:howdy world
cache.get:foo");
            Assert.Equal("howdy world", lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void CacheSetSleepGet()
        {
            var lambda = Common.Evaluate(@"
cache.set:foo
   expiration:1
   value:howdy world
sleep:2000
cache.get:foo");
            Assert.Null(lambda.Children.Skip(2).First().Value);
        }

        [Fact]
        public void CacheSetListLimit_01()
        {
            var lambda = Common.Evaluate(@"
cache.set:foo1
   expiration:5
   value:howdy world1
cache.set:foo2
   expiration:5
   value:howdy world2
cache.list:foo
   limit:1
   offset:1");
            Assert.Single(lambda.Children.Skip(2).First().Children);
            Assert.Equal(".", lambda.Children.Skip(2).First().Children.First().Name);
            Assert.Equal("key", lambda.Children.Skip(2).First().Children.First().Children.First().Name);
            Assert.Equal("foo2", lambda.Children.Skip(2).First().Children.First().Children.First().Value);
            Assert.Equal("value", lambda.Children.Skip(2).First().Children.First().Children.Skip(1).First().Name);
            Assert.Equal("howdy world2", lambda.Children.Skip(2).First().Children.First().Children.Skip(1).First().Value);
        }

        [Fact]
        public void CacheSetListLimit_03()
        {
            var lambda = Common.Evaluate(@"
cache.set:foo1
   expiration:5
   value:howdy world1
cache.set:foo2
   expiration:5
   value:howdy world2
cache.list
   filter:foo
   limit:1
   offset:1");
            Assert.Single(lambda.Children.Skip(2).First().Children);
            Assert.Equal(".", lambda.Children.Skip(2).First().Children.First().Name);
            Assert.Equal("key", lambda.Children.Skip(2).First().Children.First().Children.First().Name);
            Assert.Equal("foo2", lambda.Children.Skip(2).First().Children.First().Children.First().Value);
            Assert.Equal("value", lambda.Children.Skip(2).First().Children.First().Children.Skip(1).First().Name);
            Assert.Equal("howdy world2", lambda.Children.Skip(2).First().Children.First().Children.Skip(1).First().Value);
        }

        [Fact]
        public void CacheSetListLimit_04()
        {
            var lambda = Common.Evaluate(@"
cache.set:foo1
   expiration:5
   value:howdy world1
cache.set:foo2
   expiration:5
   value:howdy world2
cache.list
   filter:foo
   limit:1
   offset:1");
            Assert.Single(lambda.Children.Skip(2).First().Children);
            Assert.Equal(".", lambda.Children.Skip(2).First().Children.First().Name);
            Assert.Equal("key", lambda.Children.Skip(2).First().Children.First().Children.First().Name);
            Assert.Equal("foo2", lambda.Children.Skip(2).First().Children.First().Children.First().Value);
            Assert.Equal("value", lambda.Children.Skip(2).First().Children.First().Children.Skip(1).First().Name);
            Assert.Equal("howdy world2", lambda.Children.Skip(2).First().Children.First().Children.Skip(1).First().Value);
        }

        [Fact]
        public void CacheSetGetExpressionValue()
        {
            var lambda = Common.Evaluate(@"
.val:int:5
cache.set:foo
   value:x:@.val
cache.get:foo");
            Assert.Equal("5", lambda.Children.Skip(2).First().Value);
        }

        [Fact]
        public void CacheSetNullifyGet()
        {
            var lambda = Common.Evaluate(@"
cache.set:foo
   expiration:5
   value:howdy world
cache.set:foo
cache.get:foo");
            Assert.Null(lambda.Children.Skip(2).First().Value);
        }

        [Fact]
        public void CacheSetGetConfig()
        {
            var lambda = Common.Evaluate(@"
cache.set:foo
   value:howdy world
cache.get:foo");
            Assert.Equal("howdy world", lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void CacheSetGetNoConfig()
        {
            var lambda = Common.Evaluate(@"
cache.set:foo
   value:howdy world
cache.get:foo", false);
            Assert.Equal("howdy world", lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void CacheSetExplicitExpiration()
        {
            var lambda = Common.Evaluate(@"
cache.set:foo
   expiration:5
   value:howdy world
cache.get:foo");
            Assert.Equal("howdy world", lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void CacheTryGet()
        {
            var lambda = Common.Evaluate(@"
cache.try-get:foo
   .lambda
      return:Howdy World
cache.get:foo");
            Assert.Equal("Howdy World", lambda.Children.First().Value);
            Assert.Equal("Howdy World", lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void CacheTryGetNoConfig()
        {
            var lambda = Common.Evaluate(@"
cache.try-get:foo
   .lambda
      return:Howdy World
cache.get:foo", false);
            Assert.Equal("Howdy World", lambda.Children.First().Value);
            Assert.Equal("Howdy World", lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void CacheTryGetExplicitExpiration()
        {
            var lambda = Common.Evaluate(@"
cache.try-get:foo
   expiration:5
   .lambda
      return:Howdy World
cache.get:foo");
            Assert.Equal("Howdy World", lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void CacheTryGetNullKey()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
cache.try-get
   .lambda
      return:Howdy World"));
        }

        [Fact]
        public void CacheTryGetIllegalKey()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
cache.try-get:.xyz
   .lambda
      return:Howdy World"));
        }

        [Fact]
        public void CacheTryGetNullLambda()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"cache.try-get:foo"));
        }

        [Fact]
        public void CacheSetClearGet_01()
        {
            var lambda = Common.Evaluate(@"
cache.set:foo
   value:howdy world
cache.clear
cache.get:foo");
            Assert.Null(lambda.Children.Skip(2).First().Value);
        }

        [Fact]
        public void CacheSetClearGet_02()
        {
            var lambda = Common.Evaluate(@"
cache.set:foo1
   value:howdy world
cache.set:foo2
   value:howdy world
cache.clear:foo
cache.list:foo");
            Assert.Empty(lambda.Children.Skip(3).First().Children);
        }

        [Fact]
        public void CacheSetClearGet_03()
        {
            var lambda = Common.Evaluate(@"
cache.set:foo1
   value:howdy world
cache.set:foo2
   value:howdy world
cache.clear:foo2
cache.list:foo");
            Assert.Single(lambda.Children.Skip(3).First().Children);
        }

        [Fact]
        public void CacheSetClearGet_04()
        {
            var lambda = Common.Evaluate(@"
cache.set:foo1
   value:howdy world
cache.set:foo2
   value:howdy world
cache.clear
   filter:foo
cache.list:foo");
            Assert.Empty(lambda.Children.Skip(3).First().Children);
        }

        [Fact]
        public void CacheSetThrows_01()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
cache.set:+foo
   value:howdy world"));
        }

        [Fact]
        public void CacheSetThrows_02()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
cache.set:.foo
   value:howdy world"));
        }

        [Fact]
        public void CacheSetThrows_03()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
cache.set:
   value:howdy world"));
        }

        [Fact]
        public void CacheSetThrows_04()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
cache.set
   value:howdy world"));
        }

        [Fact]
        public void CacheSetThrows_05()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
cache.set:foo
   value:howdy world
   expiration:-5"));
        }

        [Fact]
        public void CacheSetCount_01()
        {
            var lambda = Common.Evaluate(@"
cache.set:foo
   value:howdy world
cache.count");
            Assert.Equal(1, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void CacheSetCount_02()
        {
            var lambda = Common.Evaluate(@"
cache.set:foo1
   value:howdy world
cache.set:foo2
   value:howdy world
cache.count:foo2");
            Assert.Equal(1, lambda.Children.Skip(2).First().Value);
        }

        [Fact]
        public void CacheSetCount_03()
        {
            var lambda = Common.Evaluate(@"
cache.set:foo1
   value:howdy world
cache.set:foo2
   value:howdy world
cache.count:foo");
            Assert.Equal(2, lambda.Children.Skip(2).First().Value);
        }

        [Fact]
        public void CacheSetCount_04()
        {
            var lambda = Common.Evaluate(@"
cache.set:foo1
   value:howdy world
cache.set:foo2
   value:howdy world
cache.set:xxx_foo2
   value:howdy world
cache.count:foo");
            Assert.Equal(2, lambda.Children.Skip(3).First().Value);
        }

        [Fact]
        public void CacheSetCount_05()
        {
            var lambda = Common.Evaluate(@"
cache.set:foo1
   value:howdy world
cache.set:foo2
   value:howdy world
cache.count
   filter:foo2");
            Assert.Equal(1, lambda.Children.Skip(2).First().Value);
        }

        [Fact]
        public void CacheSetList()
        {
            var lambda = Common.Evaluate(@"
cache.set:foo
   value:howdy world
cache.list");
            Assert.Single(lambda.Children.Skip(1).First().Children);
            Assert.Equal("foo", lambda.Children.Skip(1).First().Children.First().Children.First(x => x.Name == "key").Value);
            Assert.Equal("howdy world", lambda.Children.Skip(1).First().Children.First().Children.First(x => x.Name == "value").Value);
        }

        [Fact]
        public void CacheSetList_Throws()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
cache.set:foo
   value:howdy world
cache.list:.xyz"));
        }

        [Fact]
        public void CacheTryGet_01()
        {
            var lambda = Common.Evaluate(@"
cache.try-get:foo
   .lambda
      return:bar
cache.get:foo");
            Assert.Equal("bar", lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void CacheTryGet_Throws_01()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
cache.try-get:foo
   expiration:-5
   .lambda
      return
         foo:bar"));
        }

        [Fact]
        public async Task CacheTryGet_Async_Throws_01()
        {
            await Assert.ThrowsAsync<HyperlambdaException>(async () => await Common.EvaluateAsync(@"
cache.try-get:foo
   expiration:-5
   .lambda
      return
         foo:bar"));
        }

        [Fact]
        public async Task CacheTryGetAsync()
        {
            var lambda = await Common.EvaluateAsync(@"
cache.try-get:foo
   .lambda
      return:Howdy World
cache.get:foo");
            Assert.Equal("Howdy World", lambda.Children.First().Value);
            Assert.Equal("Howdy World", lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public async Task CacheTryGetNodeAsync()
        {
            var lambda = await Common.EvaluateAsync(@"
cache.try-get:foo
   .lambda
      return:bar
cache.get:foo");
            Assert.Equal("bar", lambda.Children.Skip(1).First().Value);
        }
    }
}
