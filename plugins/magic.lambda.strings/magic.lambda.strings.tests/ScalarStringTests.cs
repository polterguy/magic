/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Linq;
using System.Threading.Tasks;
using Xunit;
using magic.node.extensions;

namespace magic.lambda.strings.tests
{
    public class ScalarStringTests
    {
        [Theory]
        [InlineData("strings.html-encode:@\"<b>&</b>\"", "&lt;b&gt;&amp;&lt;/b&gt;")]
        [InlineData("strings.html-decode:@\"&lt;b&gt;&amp;&lt;/b&gt;\"", "<b>&</b>")]
        [InlineData("strings.url-encode:a b&c", "a+b%26c")]
        [InlineData("strings.url-decode:a+b%26c", "a b&c")]
        [InlineData("strings.byte-count:hello", 5)]
        public void Scalars(string hl, object expected)
        {
            var lambda = Common.Evaluate(hl);
            Assert.Equal(expected, lambda.Children.First().Value);
        }

        [Fact]
        public void ByteCountCountsBytesNotCharacters()
        {
            var lambda = Common.Evaluate("strings.byte-count:héllo €");
            Assert.Equal(10, lambda.Children.First().Value);
        }

        [Fact]
        public async Task SubstringFromStart()
        {
            var lambda = await Common.EvaluateAsync("strings.substring:hello world\n   :int:6");
            Assert.Equal("world", lambda.Children.First().Value);
            Assert.Empty(lambda.Children.First().Children);
        }

        [Fact]
        public async Task SubstringWithLength()
        {
            var lambda = await Common.EvaluateAsync("strings.substring:hello world\n   :int:3\n   :int:4");
            Assert.Equal("lo w", lambda.Children.First().Value);
        }

        [Fact]
        public async Task SubstringLengthIsClampedToTheEnd()
        {
            var lambda = await Common.EvaluateAsync("strings.substring:hello world\n   :int:6\n   :int:100");
            Assert.Equal("world", lambda.Children.First().Value);
        }

        [Fact]
        public async Task SubstringWithoutArgumentsThrows()
        {
            await Assert.ThrowsAsync<HyperlambdaException>(() => Common.EvaluateAsync("strings.substring:hello"));
        }

        [Fact]
        public void ConcatOfExpressionWithoutChildren()
        {
            var lambda = Common.Evaluate(".foo\n   .:a\n   .:b\n   .:c\nstrings.concat:x:@.foo/*");
            Assert.Equal("abc", lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void MixinWithUnterminatedExpressionKeepsTheText()
        {
            var lambda = Common.Evaluate(".foo:@\"Hello {{unterminated\"\nstrings.mixin:x:-");
            Assert.Equal("Hello {{unterminated", lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void MixinWithFailingHyperlambdaKeepsTheTemplate()
        {
            var lambda = Common.Evaluate(".foo:@\"a {{\nthrow:oops\n}} b\"\nstrings.mixin:x:-");
            Assert.Equal("a {{\nthrow:oops\n}} b", lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void MixinWithMultipleMatchesKeepsTheTemplate()
        {
            var lambda = Common.Evaluate(".foo:@\"a {{*/id}} b\"\nstrings.mixin:x:-\n   id:1\n   id:2");
            Assert.Equal("a {{*/id}} b", lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void MixinWithNoMatchIsEmpty()
        {
            var lambda = Common.Evaluate(".foo:@\"a {{*/missing}} b\"\nstrings.mixin:x:-\n   id:1");
            Assert.Equal("a  b", lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void MixinHyperlambdaReceivesArguments()
        {
            var lambda = Common.Evaluate(".foo:@\"a {{\nreturn:x:@.arguments/*/id\n}} b\"\nstrings.mixin:x:-\n   id:5");
            Assert.Equal("a 5 b", lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void MixinStripRemovesExpressions()
        {
            var lambda = Common.Evaluate(".foo:@\"a {{*/id}} b\"\nstrings.mixin:x:-\n   strip:bool:true\n   id:5");
            Assert.Equal("a  b", lambda.Children.Skip(1).First().Value);
        }
    }
}
