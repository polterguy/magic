/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Threading.Tasks;
using Xunit;
using magic.node.extensions;

namespace magic.lambda.strings.tests
{
    public class EndsWithTests
    {
        [Fact]
        public void EndsWith_001()
        {
            var lambda = Common.Evaluate(@"
.foo:foo-xxx
strings.ends-with:x:-
   .:xxx");
            Assert.True(lambda.Children.Skip(1).First().Get<bool>());
        }

        [Fact]
        public void EndsWith_002()
        {
            var lambda = Common.Evaluate(@"
.foo:foo-xxx
strings.ends-with:x:-
   .:foo
strings.ends-with:x:-/-
   .:xxx");
            Assert.False(lambda.Children.Skip(1).First().Get<bool>());
            Assert.True(lambda.Children.Skip(2).First().Get<bool>());
        }

        [Fact]
        public void EndsWith_003()
        {
            var lambda = Common.Evaluate(@"
.foo:foo-xxy
strings.ends-with:x:-
   .:xxx");
            Assert.False(lambda.Children.Skip(1).First().Get<bool>());
        }

        [Fact]
        public void EndsWith_004()
        {
            var lambda = Common.Evaluate(@"
.foo
strings.ends-with:x:-
   .:xxx");
            Assert.False(lambda.Children.Skip(1).First().Get<bool>());
        }

        [Fact]
        public async Task EndsWithAsync()
        {
            var lambda = await Common.EvaluateAsync(@"
.foo:foo-xxx
strings.ends-with:x:-
   .:foo
strings.ends-with:x:-/-
   .:xxx");
            Assert.False(lambda.Children.Skip(1).First().Get<bool>());
            Assert.True(lambda.Children.Skip(2).First().Get<bool>());
        }

        [Fact]
        public void EndsWithThrows()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
.foo:foo-xxx
strings.ends-with:x:-
"));
        }
    }
}
