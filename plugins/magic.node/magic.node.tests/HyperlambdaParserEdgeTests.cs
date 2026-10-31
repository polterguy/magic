/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using Xunit;
using magic.node.extensions;
using magic.node.extensions.hyperlambda;

namespace magic.node.tests
{
    /*
     * The less travelled paths of the Hyperlambda tokenizer: string literals that do not end, escape sequences,
     * multi line comments in their different forms, and spacing mistakes.
     */
    public class HyperlambdaParserEdgeTests
    {
        static readonly string[] Siblings = { "foo", "bar" };
        static readonly string[] Children = { "bar", "qux" };

        [Theory]
        [InlineData("foo:\"bar\"x", "Garbage characters after string literal")]
        [InlineData("foo:@\"bar\"x", "Garbage characters after string literal")]
        [InlineData("foo:@\"abc", "String literal not closed before end of input")]
        [InlineData("foo:\"abc", "Syntax error, string literal not closed before end of input")]
        [InlineData("foo:\"a\\xb\"", "Invalid escape sequence found in string literal")]
        [InlineData("foo:\"abc\\", "End of input found when looking for escape character in single line string literal")]
        [InlineData("/* never closed", "EOF encountered before end of multi line comment")]
        [InlineData("foo\n  bar", "Not correct number of spaces")]
        [InlineData(" foo", "Not correct number of spaces")]
        public void SyntaxErrorsAreReportedWithTheirLine(string hl, string message)
        {
            var exception = Assert.Throws<HyperlambdaException>(() => HyperlambdaParser.Parse(hl));
            Assert.StartsWith(message, exception.Message);
            Assert.Contains("near line", exception.Message);
        }

        [Fact]
        public void AnUnknownTypeIsRejected()
        {
            var exception = Assert.Throws<HyperlambdaException>(() => HyperlambdaParser.Parse("foo:a:b"));
            Assert.Equal("Unknown type declaration 'a'", exception.Message);
        }

        [Fact]
        public void EveryEscapeSequenceIsUnescaped()
        {
            var lambda = HyperlambdaParser.Parse("foo:\"a\\tb\\n\\r\\a\\b\\f\\v\\\\\\\"\\'\\@z\"");
            Assert.Equal("a\tb\n\r\a\b\f\v\\\"'\\@z", lambda.Children.First().Value);
        }

        [Fact]
        public void SingleQuotedStringsEscapeTheirOwnQuote()
        {
            var lambda = HyperlambdaParser.Parse("foo:'it\\'s'");
            Assert.Equal("it's", lambda.Children.First().Value);
        }

        [Fact]
        public void MultiLineStringsDoubleTheirQuotes()
        {
            var lambda = HyperlambdaParser.Parse("foo:@\"line1\nline2 \"\"quoted\"\"\"");
            Assert.Equal("line1\nline2 \"quoted\"", lambda.Children.First().Value);
        }

        [Theory]
        [InlineData("/* hello */\nfoo")]
        [InlineData("/*\n * a\n * b\n */\nfoo")]
        [InlineData("/*\n *a\n */\nfoo")]
        [InlineData("/**/\nfoo")]
        [InlineData("// comment\nfoo")]
        public void CommentsDoNotBecomeNodes(string hl)
        {
            var lambda = HyperlambdaParser.Parse(hl);
            Assert.Single(lambda.Children);
            Assert.Equal("foo", lambda.Children.First().Name);
        }

        [Fact]
        public void NamesCanBeQuoted()
        {
            var double_ = HyperlambdaParser.Parse("\"foo bar\":x").Children.First();
            Assert.Equal("foo bar", double_.Name);
            Assert.Equal("x", double_.Value);

            var single = HyperlambdaParser.Parse("'foo':x").Children.First();
            Assert.Equal("foo", single.Name);
            Assert.Equal("x", single.Value);
        }

        [Theory]
        [InlineData("foo:")]
        [InlineData("foo: ")]
        public void ANameWithNothingAfterTheColonHasAnEmptyStringValue(string hl)
        {
            var node = HyperlambdaParser.Parse(hl).Children.First();
            Assert.Equal("foo", node.Name);
            Assert.Equal("", node.Value);
        }

        [Fact]
        public void SpaceAfterATypeIsIgnored()
        {
            var node = HyperlambdaParser.Parse("foo:int: 5").Children.First();
            Assert.Equal(5, node.Value);
        }

        [Theory]
        [InlineData("foo\n\n\nbar")]
        [InlineData("foo\r\nbar")]
        public void BlankLinesAndWindowsLineEndingsSeparateSiblings(string hl)
        {
            var names = HyperlambdaParser.Parse(hl).Children.Select(x => x.Name).ToArray();
            Assert.Equal(Siblings, names);
        }

        [Fact]
        public void IndentationBuildsTheTree()
        {
            var foo = HyperlambdaParser.Parse("foo\n   bar\n      baz:int:5\n   qux").Children.Single();
            Assert.Equal(Children, foo.Children.Select(x => x.Name).ToArray());
            Assert.Equal(5, foo.Children.First().Children.Single().Value);
        }

        [Theory]
        [InlineData("")]
        [InlineData("\n\n")]
        public void EmptyInputHasNoNodes(string hl)
        {
            Assert.Empty(HyperlambdaParser.Parse(hl).Children);
        }
    }
}
