/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.IO;
using System.Linq;
using System.Text;
using Xunit;
using magic.node;
using magic.node.extensions;
using magic.node.extensions.hyperlambda;
using magic.node.extensions.hyperlambda.helpers;

namespace magic.node.tests
{
    public class ExtraCoverageTests
    {
        static readonly string[] Sorted = ["a", "b", "c"];
        static readonly string[] FirstTwo = ["0", "1"];

        [Fact]
        public void SortOrdersChildren()
        {
            var node = new Node("root");
            node.Add(new Node("c"));
            node.Add(new Node("a"));
            node.Add(new Node("b"));
            node.Sort((x, y) => string.CompareOrdinal(x.Name, y.Name));
            Assert.Equal(Sorted, node.Children.Select(x => x.Name).ToArray());
        }

        [Fact]
        public void SortWithoutChildrenDoesNothing()
        {
            var node = new Node("root");
            node.Sort((x, y) => 0);
            Assert.Empty(node.Children);
        }

        [Fact]
        public void MaxKeepsTheFirstNodes()
        {
            var node = new Node("root");
            for (var idx = 0; idx < 5; idx++)
            {
                node.Add(new Node(idx.ToString()));
            }
            node.Max(2);
            Assert.Equal(FirstTwo, node.Children.Select(x => x.Name).ToArray());
            node.Max(10);
            Assert.Equal(2, node.Children.Count());
        }

        [Fact]
        public void MaxWithoutChildrenDoesNothing()
        {
            var node = new Node("root");
            node.Max(1);
            Assert.Empty(node.Children);
        }

        [Theory]
        [InlineData("a\\ab", "a\ab")]
        [InlineData("a\\bb", "a\bb")]
        [InlineData("a\\fb", "a\fb")]
        [InlineData("a\\tb", "a\tb")]
        [InlineData("a\\vb", "a\vb")]
        [InlineData("a\\nb", "a\nb")]
        [InlineData("a\\rb", "a\rb")]
        [InlineData("a\\\\b", "a\\b")]
        [InlineData("a\\'b", "a'b")]
        [InlineData("a\\\"b", "a\"b")]
        [InlineData("a\\@b", "a\\@b")]
        public void EscapeSequencesInStringLiterals(string literal, string expected)
        {
            var result = HyperlambdaParser.Parse("foo:\"" + literal + "\"");
            Assert.Equal(expected, result.Children.First().Value);
        }

        [Theory]
        [InlineData("a\tb")]
        [InlineData("a\\b")]
        [InlineData("a\"b")]
        [InlineData("a'b")]
        [InlineData("a:b")]
        [InlineData("a\r\nb")]
        [InlineData("a\nb\tc\\d\"e'f:g")]
        public void GeneratedStringsRoundTrip(string value)
        {
            var hl = HyperlambdaGenerator.GetHyperlambda(new[] { new Node("foo", value) });
            var parsed = HyperlambdaParser.Parse(hl);
            Assert.Equal(value, parsed.Children.First().Value);
        }

        [Theory]
        [InlineData("foo:'bar'x")]
        [InlineData("foo:'bar' x")]
        [InlineData("foo:\"\"\"bar\"\"\"x")]
        [InlineData("foo\n   bar:\"baz\"x")]
        public void GarbageAfterStringsIsRejected(string hl)
        {
            Assert.Throws<HyperlambdaException>(() => HyperlambdaParser.Parse(hl));
        }

        [Fact]
        public void TimeSpanGuidAndCharConversions()
        {
            Assert.Equal(("time", "600000000"), Converter.ToString(TimeSpan.FromMinutes(1)));
            var guid = Guid.NewGuid();
            Assert.Equal(("guid", guid.ToString()), Converter.ToString(guid));
            Assert.Equal(("char", "x"), Converter.ToString('x'));
            Assert.Equal(("byte", "7"), Converter.ToString((byte)7));
            Assert.Equal(("sbyte", "-7"), Converter.ToString((sbyte)-7));
        }

        [Fact]
        public void TimeSpanGuidAndCharParse()
        {
            Assert.Equal(TimeSpan.FromMinutes(1), Converter.ToObject("600000000", "time"));
            var guid = Guid.NewGuid();
            Assert.Equal(guid, Converter.ToObject(guid.ToString(), "guid"));
            Assert.Equal('x', Converter.ToObject("x", "char"));
            Assert.Equal((byte)7, Converter.ToObject("7", "byte"));
            Assert.Equal((sbyte)-7, Converter.ToObject("-7", "sbyte"));
        }

        [Fact]
        public void DateTimeOffsetConversion()
        {
            var value = new DateTimeOffset(2024, 1, 2, 3, 4, 5, TimeSpan.Zero);
            // The converter unboxes the value as a DateTime, so a DateTimeOffset currently cannot be converted.
            Assert.Throws<InvalidCastException>(() => Converter.ToString(value));
        }

        static System.Collections.Generic.List<Token> Tokens(string hl)
        {
            return new HyperlambdaTokenizer(new MemoryStream(Encoding.UTF8.GetBytes(hl))).Tokens();
        }

        [Theory]
        [InlineData("a\\ab", "a\ab")]
        [InlineData("a\\bb", "a\bb")]
        [InlineData("a\\fb", "a\fb")]
        [InlineData("a\\tb", "a\tb")]
        [InlineData("a\\vb", "a\vb")]
        [InlineData("a\\nb", "a\nb")]
        [InlineData("a\\rb", "a\rb")]
        [InlineData("a\\\\b", "a\\b")]
        [InlineData("a\\'b", "a'b")]
        [InlineData("a\\\"b", "a\"b")]
        [InlineData("a\\@b", "a\\@b")]
        public void TokenizerEscapeSequences(string literal, string expected)
        {
            var tokens = Tokens("foo:\"" + literal + "\"");
            Assert.Equal(expected, tokens.Last().Value);
        }

        [Fact]
        public void TokenizerRejectsInvalidEscape()
        {
            Assert.Throws<HyperlambdaException>(() => Tokens("foo:\"a\\xb\""));
        }

        [Theory]
        [InlineData("foo:\"bar\"x")]
        [InlineData("foo:'bar'x")]
        [InlineData("foo:@\"bar\"x")]
        [InlineData("foo:@\"bar\" x")]
        public void TokenizerRejectsGarbageAfterStrings(string hl)
        {
            var ex = Assert.Throws<HyperlambdaException>(() => Tokens(hl));
            Assert.Contains("Garbage characters after", ex.Message);
        }

        [Fact]
        public void ChildAtReturnsTheChildAtTheIndex()
        {
            var node = new Node("root", null, [new Node("a"), new Node("b")]);
            Assert.Equal("b", node.ChildAt(1).Name);
        }

        [Fact]
        public void ChildAtOfNodeWithoutChildrenThrows()
        {
            Assert.Throws<ArgumentOutOfRangeException>(() => new Node("root").ChildAt(0));
        }
    }
}
