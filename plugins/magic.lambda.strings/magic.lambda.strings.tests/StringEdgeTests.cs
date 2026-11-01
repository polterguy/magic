/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using Xunit;
using magic.node.extensions;

namespace magic.lambda.strings.tests
{
    public class StringEdgeTests
    {
        [Fact]
        public void MatchesRequiresExactlyOneExpression()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate("strings.matches:foo bar\n   .:a\n   .:b"));
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate("strings.matches:foo bar"));
        }

        [Fact]
        public void CapitalizeOfEmptyStringIsEmpty()
        {
            var lambda = Common.Evaluate("strings.capitalize:\"\"");
            Assert.Equal("", lambda.Children.First().Value);
        }

        [Fact]
        public void CapitalizeUppercasesTheFirstLetterOnly()
        {
            var lambda = Common.Evaluate("strings.capitalize:hello world");
            Assert.Equal("Hello world", lambda.Children.First().Value);
        }
    }
}
