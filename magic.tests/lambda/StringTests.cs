/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System.Linq;
using Xunit;

namespace magic.tests.lambda
{
    public class StringTests
    {
        [Fact]
        public void Replace_01()
        {
            var lambda = Common.Evaluate(@"
.foo1:howdy world
replace:x:-
   what:world
   with:universe");
            Assert.Equal("howdy universe", lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Contains_01()
        {
            var lambda = Common.Evaluate(@"
.foo1:howdy world
contains:x:-
   .:world");
            Assert.Equal(true, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Contains_02()
        {
            var lambda = Common.Evaluate(@"
.foo1:howdy tjobing
contains:x:-
   .:world");
            Assert.Equal(false, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Concat_01()
        {
            var lambda = Common.Evaluate(@"
.foo:foo
concat
   get-value:x:@.foo
   .:' bar'");
            Assert.Equal("foo bar", lambda.Children.Skip(1).First().Value);
        }
    }
}
