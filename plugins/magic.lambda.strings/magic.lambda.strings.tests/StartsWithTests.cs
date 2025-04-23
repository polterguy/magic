/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Threading.Tasks;
using Xunit;
using magic.node.extensions;

namespace magic.lambda.strings.tests
{
    public class StartsWithTests
    {
        [Fact]
        public void StartsWith_001()
        {
            var lambda = Common.Evaluate(@"
.foo:foo-xxx
strings.starts-with:x:-
   .:foo
strings.starts-with:x:-/-
   .:xxx");
            Assert.True(lambda.Children.Skip(1).First().Get<bool>());
            Assert.False(lambda.Children.Skip(2).First().Get<bool>());
        }

        [Fact]
        public void StartsWith_002()
        {
            var lambda = Common.Evaluate(@"
.foo
strings.starts-with:x:-
   .:foo");
            Assert.False(lambda.Children.Skip(1).First().Get<bool>());
        }

        [Fact]
        public async Task StartsWithAsync()
        {
            var lambda = await Common.EvaluateAsync(@"
.foo:foo-xxx
strings.starts-with:x:-
   .:foo
strings.starts-with:x:-/-
   .:xxx");
            Assert.True(lambda.Children.Skip(1).First().Get<bool>());
            Assert.False(lambda.Children.Skip(2).First().Get<bool>());
        }

        [Fact]
        public void StartsWithThrows()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
.foo:foo-xxx
strings.starts-with:x:-
"));
        }
    }
}
