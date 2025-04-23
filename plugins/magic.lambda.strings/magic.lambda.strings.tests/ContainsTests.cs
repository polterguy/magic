/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Threading.Tasks;
using Xunit;
using magic.node.extensions;

namespace magic.lambda.strings.tests
{
    public class ContainsTests
    {
        [Fact]
        public void ContainsTrue()
        {
            var lambda = Common.Evaluate(@"
.foo1:howdy world
strings.contains:x:-
   .:world");
            Assert.Equal(true, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void ContainsTrueReference()
        {
            var lambda = Common.Evaluate(@"
.foo1:howdy world
.foo2:x:-
strings.contains:x:-
   .:world");
            Assert.Equal(true, lambda.Children.Skip(2).First().Value);
        }

        [Fact]
        public void ContainsFalse()
        {
            var lambda = Common.Evaluate(@"
.foo1:howdy tjobing
strings.contains:x:-
   .:world");
            Assert.Equal(false, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void ContainsNull()
        {
            var lambda = Common.Evaluate(@"
.foo1
strings.contains:x:-
   .:world");
            Assert.Equal(false, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void ContainsNullReference()
        {
            var lambda = Common.Evaluate(@"
.foo1
.foo2:x:-
strings.contains:x:-
   .:world");
            Assert.Equal(false, lambda.Children.Skip(2).First().Value);
        }

        [Fact]
        public async Task ContainsAsync()
        {
            var lambda = await Common.EvaluateAsync(@"
.foo1:howdy world
strings.contains:x:-
   .:world");
            Assert.Equal(true, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void ContainsThrows()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
.foo1:howdy world
strings.contains:x:-
"));
        }
    }
}
