/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using Xunit;
using magic.node.extensions;
using magic.node.extensions.hyperlambda;

namespace magic.node.tests
{
    public class ParserEscapeTests
    {
        static string Value(string hl) => HyperlambdaParser.Parse(hl).Children.First().Get<string>();

        [Theory]
        [InlineData(@"foo:""a\tb""", "a\tb")]
        [InlineData(@"foo:""a\nb""", "a\nb")]
        [InlineData(@"foo:""a\rb""", "a\rb")]
        [InlineData(@"foo:""a\ab""", "a\ab")]
        [InlineData(@"foo:""a\bb""", "a\bb")]
        [InlineData(@"foo:""a\fb""", "a\fb")]
        [InlineData(@"foo:""a\vb""", "a\vb")]
        [InlineData(@"foo:""a\\b""", "a\\b")]
        [InlineData(@"foo:""a\""b""", "a\"b")]
        [InlineData(@"foo:""a\'b""", "a'b")]
        [InlineData(@"foo:'a\'b'", "a'b")]
        public void EscapeSequencesInSingleLineStrings(string hl, string expected)
        {
            Assert.Equal(expected, Value(hl));
        }

        [Fact]
        public void AtSignEscapeIsKeptEscaped()
        {
            Assert.Equal("\\@x", Value(@"foo:""\@x"""));
        }

        [Fact]
        public void InvalidEscapeSequenceThrows()
        {
            var ex = Assert.Throws<HyperlambdaException>(() => HyperlambdaParser.Parse(@"foo:""a\qb"""));
            Assert.Contains("escape", ex.Message);
        }

        [Fact]
        public void EscapeAtEndOfInputThrows()
        {
            Assert.Throws<HyperlambdaException>(() => HyperlambdaParser.Parse("foo:\"a\\"));
        }

        [Fact]
        public void UnclosedSingleLineStringThrows()
        {
            var ex = Assert.Throws<HyperlambdaException>(() => HyperlambdaParser.Parse("foo:\"never closed"));
            Assert.Contains("not closed", ex.Message);
        }

        [Fact]
        public void MultiLineStringKeepsNewLinesAndUnescapesDoubledQuotes()
        {
            var lambda = HyperlambdaParser.Parse("foo:@\"line one\nline \"\"two\"\"\"\nbar:x");
            Assert.Equal("line one\nline \"two\"", lambda.Children.First().Get<string>());
            Assert.Equal("x", lambda.Children.Skip(1).First().Get<string>());
        }

        [Fact]
        public void UnclosedMultiLineStringThrows()
        {
            var ex = Assert.Throws<HyperlambdaException>(() => HyperlambdaParser.Parse("foo:@\"never closed"));
            Assert.Contains("not closed", ex.Message);
        }

        [Fact]
        public void MultiLineNameAndValue()
        {
            var lambda = HyperlambdaParser.Parse("@\"a\nb\":@\"c\nd\"");
            Assert.Equal("a\nb", lambda.Children.First().Name);
            Assert.Equal("c\nd", lambda.Children.First().Get<string>());
        }

        [Fact]
        public void BlockCommentsBecomeCommentNodes()
        {
            var lambda = HyperlambdaParser.Parse("/*\n * First line\n * Second line\n */\nfoo:bar", true);
            Assert.Equal("..", lambda.Children.First().Name);
            Assert.Equal("First line\r\nSecond line", lambda.Children.First().Get<string>());
            Assert.Equal("foo", lambda.Children.Skip(1).First().Name);
        }

        [Fact]
        public void BlockCommentWithoutStarsOnItsLines()
        {
            var lambda = HyperlambdaParser.Parse("/*\nplain\n*/\nfoo:bar", true);
            Assert.Equal("plain", lambda.Children.First().Get<string>());
        }

        [Fact]
        public void EmptyBlockCommentHasNoText()
        {
            var lambda = HyperlambdaParser.Parse("/*\n */\nfoo:bar", true);
            Assert.Equal("..", lambda.Children.First().Name);
            Assert.True(string.IsNullOrEmpty(lambda.Children.First().Value as string));
            Assert.Equal("foo", lambda.Children.Skip(1).First().Name);
        }

        [Fact]
        public void CommentsAreSkippedUnlessAskedFor()
        {
            var lambda = HyperlambdaParser.Parse("// a comment\n/* a block */\nfoo:bar");
            Assert.Single(lambda.Children);
            Assert.Equal("foo", lambda.Children.First().Name);
        }

        [Fact]
        public void LineCommentBecomesCommentNode()
        {
            var lambda = HyperlambdaParser.Parse("// a comment\nfoo:bar", true);
            Assert.Equal("..", lambda.Children.First().Name);
            Assert.Equal("a comment", lambda.Children.First().Get<string>());
        }

        [Fact]
        public void BadIndentationThrows()
        {
            Assert.Throws<HyperlambdaException>(() => HyperlambdaParser.Parse("foo\n  bar"));
            Assert.Throws<HyperlambdaException>(() => HyperlambdaParser.Parse("foo\n      bar"));
        }

        [Fact]
        public void TypedValuesAndEmptyNames()
        {
            var lambda = HyperlambdaParser.Parse("foo:int:42\n:bar\nbaz:bool:true\nqux:date:\"2020-01-02T03:04:05\"");
            Assert.Equal(42, lambda.Children.First().Value);
            Assert.Equal("", lambda.Children.Skip(1).First().Name);
            Assert.Equal(true, lambda.Children.Skip(2).First().Value);
            Assert.IsType<System.DateTime>(lambda.Children.Skip(3).First().Value);
        }
    }
}
