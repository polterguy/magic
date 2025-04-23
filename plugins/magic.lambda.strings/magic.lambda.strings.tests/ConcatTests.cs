/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Threading.Tasks;
using Xunit;
using magic.node.extensions;

namespace magic.lambda.strings.tests
{
    public class ConcatTests
    {
        [Fact]
        public void Concat()
        {
            var lambda = Common.Evaluate(@"
.foo:foo
strings.concat
   get-value:x:@.foo
   .:' bar'");
            Assert.Equal("foo bar", lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public async Task ConcatAsync()
        {
            var lambda = await Common.EvaluateAsync(@"
.foo:foo
strings.concat
   get-value:x:@.foo
   .:' bar'");
            Assert.Equal("foo bar", lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void ConcatThrows()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
.foo:foo
strings.concat
"));
        }
    }
}
