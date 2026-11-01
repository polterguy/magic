/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.IO;
using System.Text;
using System.Linq;
using Xunit;
using magic.node.extensions;
using magic.node.extensions.hyperlambda;
using magic.node.extensions.hyperlambda.helpers;

namespace magic.node.tests
{
    /*
     * Unit tests for Hyperlambda parser.
     */
    public class HyperlambdaParserTests
    {
        [Fact]
        public void Empty_01()
        {
            // Creating some lambda object.
            var result = HyperlambdaParser.Parse("").Children.ToList();

            // Asserts.
            Assert.Empty(result);
        }

        [Fact]
        public void Empty_02()
        {
            // Creating some lambda object.
            var result = HyperlambdaParser.Parse("\r\n\n\r\r\r\n\n\n").Children.ToList();

            // Asserts.
            Assert.Empty(result);
        }

        [Fact]
        public void Empty_03()
        {
            // Creating some lambda object.
            var result = HyperlambdaParser.Parse("    ").Children.ToList();

            // Asserts.
            Assert.Empty(result);
        }

        [Fact]
        public void SingleNode()
        {
            // Creating some lambda object.
            var result = HyperlambdaParser.Parse("foo").Children.ToList();

            // Asserts.
            Assert.Single(result);
            Assert.Equal("foo", result.First().Name);
            Assert.Null(result.First().Value);
            Assert.Empty(result.First().Children);
        }

        [Fact]
        public void CRSequence()
        {
            // Creating some lambda object.
            var result = HyperlambdaParser.Parse("foo\n").Children.ToList();

            // Asserts.
            Assert.Single(result);
            Assert.Equal("foo", result.First().Name);
            Assert.Null(result.First().Value);
            Assert.Empty(result.First().Children);
        }

        [Fact]
        public void EmptyStringLiteral()
        {
            // Creating some lambda object.
            var result = HyperlambdaParser.Parse(@"foo:""""").Children.ToList();

            // Asserts.
            Assert.Single(result);
            Assert.Equal("foo", result.First().Name);
            Assert.Equal("", result.First().Value);
            Assert.Empty(result.First().Children);
        }

        [Fact]
        public void OnlyBackSlash()
        {
            // Creating some lambda object.
            var result = HyperlambdaParser.Parse(@"foo:""\\""").Children.ToList();

            // Asserts.
            Assert.Single(result);
            Assert.Equal("foo", result.First().Name);
            Assert.Equal("\\", result.First().Value);
            Assert.Empty(result.First().Children);

            var hl = HyperlambdaGenerator.GetHyperlambda(result);
            Assert.Equal(@"foo:""\\""" + "\r\n", hl);
        }

        [Fact]
        public void EscapedStringLiteral_01()
        {
            // Creating some lambda object.
            var result = HyperlambdaParser.Parse(@"foo:""\""""").Children.ToList();

            // Asserts.
            Assert.Single(result);
            Assert.Equal("foo", result.First().Name);
            Assert.Equal("\"", result.First().Value);
            Assert.Empty(result.First().Children);
        }

        [Fact]
        public void ParseBothWaysEscapeChars_01()
        {
            // Creating some lambda object.
            var original = @".foo:x:""@.howdy/*/=\""{.dp/#/**/#text}\""""
";
            var lambda = HyperlambdaParser.Parse(original).Children.ToList();
            var hl = HyperlambdaGenerator.GetHyperlambda(lambda);

            // Asserts.
            Assert.Equal(original, hl);
        }

        [Fact]
        public void EscapedStringLiteral_02()
        {
            // Creating some lambda object.
            var result = HyperlambdaParser.Parse(@"foo:""\'""").Children.ToList();

            // Asserts.
            Assert.Single(result);
            Assert.Equal("foo", result.First().Name);
            Assert.Equal("'", result.First().Value);
            Assert.Empty(result.First().Children);
        }

        [Fact]
        public void EscapedStringLiteral_03()
        {
            // Creating some lambda object.
            var result = HyperlambdaParser.Parse(@"foo:""\\""").Children.ToList();

            // Asserts.
            Assert.Single(result);
            Assert.Equal("foo", result.First().Name);
            Assert.Equal("\\", result.First().Value);
            Assert.Empty(result.First().Children);
        }

        [Fact]
        public void EscapedStringLiteral_04()
        {
            // Creating some lambda object.
            var result = HyperlambdaParser.Parse(@"foo:""\a\b\f\t\v\r\n""").Children.ToList();

            // Asserts.
            Assert.Single(result);
            Assert.Equal("foo", result.First().Name);
            Assert.Equal("\a\b\f\t\v\r\n", result.First().Value);
            Assert.Empty(result.First().Children);
        }

        [Fact]
        public void EscapedStringLiteral_05()
        {
            // Creating some lambda object.
            var result = HyperlambdaParser.Parse("foo:@\"q\n\"").Children.ToList();

            // Asserts.
            Assert.Single(result);
            Assert.Equal("foo", result.First().Name);
            Assert.Equal("q\n", result.First().Value);
            Assert.Empty(result.First().Children);
        }

        [Fact]
        public void EscapedStringLiteral_06()
        {
            // Creating some lambda object.
            var result = HyperlambdaParser.Parse(@"foo:""\""""").Children.ToList();

            // Asserts.
            Assert.Single(result);
            Assert.Equal("foo", result.First().Name);
            Assert.Equal("\"", result.First().Value);
            Assert.Empty(result.First().Children);
        }

        [Fact]
        public void EscapedStringLiteral_07()
        {
            // Creating some lambda object.
            var result = HyperlambdaParser.Parse(@"foo:""\r\n""").Children.ToList();

            // Asserts.
            Assert.Single(result);
            Assert.Equal("foo", result.First().Name);
            Assert.Equal("\r\n", result.First().Value);
            Assert.Empty(result.First().Children);
        }

        [Fact]
        public void BadCRLFSequences_03()
        {
            // Creating some lambda object.
            Assert.Throws<HyperlambdaException>(() => HyperlambdaParser.Parse(@"foo:""\""").Children.ToList());
        }

        [Fact]
        public void BadCRLFSequence_Throws_04()
        {
            // Creating some lambda object.
            Assert.Throws<HyperlambdaException>(() => HyperlambdaParser.Parse(@"foo:""\r").Children.ToList());
        }

        [Fact]
        public void BadEscapeChar_Throws()
        {
            // Creating some lambda object.
            Assert.Throws<HyperlambdaException>(() => HyperlambdaParser.Parse(@"foo:""\q""").Children.ToList());
        }

        [Fact]
        public void ReadFromStream()
        {
            using (var stream = new MemoryStream(Encoding.UTF8.GetBytes("foo")))
            {
                // Creating some lambda object.
                var result = HyperlambdaParser.Parse(stream).Children.ToList();

                // Asserts.
                Assert.Single(result);
                Assert.Equal("foo", result.First().Name);
                Assert.Null(result.First().Value);
                Assert.Empty(result.First().Children);
            }
        }

        [Fact]
        public void NodeWithEmptyValue()
        {
            // Creating some lambda object.
            var result = HyperlambdaParser.Parse("foo:").Children.ToList();

            // Asserts.
            Assert.Single(result);
            Assert.Equal("foo", result.First().Name);
            Assert.Equal("", result.First().Value);
            Assert.Empty(result.First().Children);
        }

        [Fact]
        public void NodeWithValue()
        {
            // Creating some lambda object.
            var result = HyperlambdaParser.Parse("foo:bar").Children.ToList();

            // Asserts.
            Assert.Single(result);
            Assert.Equal("foo", result.First().Name);
            Assert.Equal("bar", result.First().Value);
            Assert.Empty(result.First().Children);
        }

        [Fact]
        public void NodeWithColonValue()
        {
            // Creating some lambda object.
            var result = HyperlambdaParser.Parse(@"foo:"":""").Children.ToList();

            // Asserts.
            Assert.Single(result);
            Assert.Equal("foo", result.First().Name);
            Assert.Equal(":", result.First().Value);
            Assert.Empty(result.First().Children);
        }

        [Fact]
        public void NodeWithTypedValue()
        {
            // Creating some lambda object.
            var result = HyperlambdaParser.Parse("foo:int:5").Children.ToList();

            // Asserts.
            Assert.Single(result);
            Assert.Equal("foo", result.First().Name);
            Assert.Equal(5, result.First().Value);
            Assert.Empty(result.First().Children);
        }

        [Fact]
        public void TwoRootNodes()
        {
            // Creating some lambda object.
            var result = HyperlambdaParser.Parse("foo1:bar1\r\nfoo2:bar2").Children.ToList();

            // Asserts.
            Assert.Equal(2, result.Count);
            Assert.Equal("foo1", result.First().Name);
            Assert.Equal("bar1", result.First().Value);
            Assert.Empty(result.First().Children);
            Assert.Equal("foo2", result.Skip(1).First().Name);
            Assert.Equal("bar2", result.Skip(1).First().Value);
            Assert.Empty(result.Skip(1).First().Children);
        }

        [Fact]
        public void NodeWithChildren()
        {
            // Creating some lambda object.
            var result = HyperlambdaParser.Parse("foo\r\n   bar").Children.ToList();

            // Asserts.
            Assert.Single(result);
            Assert.Equal("foo", result.First().Name);
            Assert.Null(result.First().Value);
            Assert.Single(result.First().Children);
            Assert.Equal("bar", result.First().Children.First().Name);
            Assert.Null(result.First().Children.First().Value);
        }

        [Fact]
        public void TwoRootNodesWithChildren()
        {
            // Creating some lambda object.
            var result = HyperlambdaParser.Parse(@"foo1
   bar
foo2
").Children.ToList();

            // Asserts.
            Assert.Equal(2, result.Count);
            Assert.Equal("foo1", result.First().Name);
            Assert.Null(result.First().Value);
            Assert.Single(result.First().Children);
            Assert.Equal("bar", result.First().Children.First().Name);
            Assert.Null(result.First().Children.First().Value);
            Assert.Equal("foo2", result.Skip(1).First().Name);
            Assert.Null(result.Skip(1).First().Value);
            Assert.Empty(result.Skip(1).First().Children);
        }

        [Fact]
        public void ComplexHierarchy()
        {
            // Creating some lambda object.
            var result = HyperlambdaParser.Parse(@"foo1
   bar1
      bar2
   bar3").Children.ToList();

            // Asserts.
            Assert.Single(result);
            Assert.Equal("foo1", result.First().Name);
            Assert.Null(result.First().Value);
            Assert.Equal(2, result.First().Children.Count());
            Assert.Equal("bar1", result.First().Children.First().Name);
            Assert.Null(result.First().Children.First().Value);
            Assert.Equal("bar2", result.First().Children.First().Children.First().Name);
            Assert.Null(result.First().Children.First().Children.First().Value);
            Assert.Equal("bar3", result.First().Children.Skip(1).First().Name);
        }

        [Fact]
        public void ComplexHierarchy_Throws()
        {
            // Creating some lambda object.
            Assert.Throws<HyperlambdaException>(() => HyperlambdaParser.Parse(@"foo1
   bar1
         bar2
   bar3"));
        }

        [Fact]
        public void DoubleQuotedString()
        {
            // Creating some lambda object.
            var result = HyperlambdaParser.Parse(@"foo1:"" howdy world """).Children.ToList();

            // Asserts.
            Assert.Single(result);
            Assert.Equal("foo1", result.First().Name);
            Assert.Equal(" howdy world ", result.First().Value);
        }

        [Fact]
        public void SingleQuotedString()
        {
            // Creating some lambda object.
            var result = HyperlambdaParser.Parse("foo1:' howdy world '").Children.ToList();

            // Asserts.
            Assert.Single(result);
            Assert.Equal("foo1", result.First().Name);
            Assert.Equal(" howdy world ", result.First().Value);
        }

        [Fact]
        public void SpacingError_Throws()
        {
            // Should throw, too few spaces in front of "bar1".
            Assert.Throws<HyperlambdaException>(() => HyperlambdaParser.Parse("foo1\r\n bar1"));
        }

        [Fact]
        public void AlphaInValue()
        {
            // Creating some lambda object.
            var result = HyperlambdaParser.Parse(@"
howdy
world:foo@bar.com");

            // Asserts.
            Assert.Equal(2, result.Children.Count());
            Assert.Equal("howdy", result.Children.First().Name);
            Assert.Null(result.Children.First().Value);
            Assert.Equal("world", result.Children.Skip(1).First().Name);
            Assert.Equal("foo@bar.com", result.Children.Skip(1).First().Value);
        }

        [Fact]
        public void SingleQuoteInValue()
        {
            // Creating some lambda object.
            var result = HyperlambdaParser.Parse(@"
howdy
world:foo'bar.com");

            // Asserts.
            Assert.Equal(2, result.Children.Count());
            Assert.Equal("howdy", result.Children.First().Name);
            Assert.Null(result.Children.First().Value);
            Assert.Equal("world", result.Children.Skip(1).First().Name);
            Assert.Equal("foo'bar.com", result.Children.Skip(1).First().Value);
        }

        [Fact]
        public void MultiLineString_01()
        {
            // Creating some lambda object.
            var result = HyperlambdaParser.Parse("foo1:@\"howdy\r\nworld \"").Children.ToList();

            // Asserts.
            Assert.Single(result);
            Assert.Equal("foo1", result.First().Name);
            Assert.Equal("howdy\r\nworld ", result.First().Value);
        }

        [Fact]
        public void MultiLineString_02()
        {
            // Creating some lambda object.
            var result = HyperlambdaParser.Parse("\r\nhowdy\r\nworld:@\"howdy\r\nworld\"");

            // Asserts.
            Assert.Equal(2, result.Children.Count());
            Assert.Equal("howdy", result.Children.First().Name);
            Assert.Null(result.Children.First().Value);
            Assert.Equal("world", result.Children.Skip(1).First().Name);
            Assert.Equal("howdy\r\nworld", result.Children.Skip(1).First().Value);
        }

        [Fact]
        public void DoubleQuoteInValue()
        {
            // Creating some lambda object.
            var result = HyperlambdaParser.Parse(@"
howdy
world:foo""bar.com");

            // Asserts.
            Assert.Equal(2, result.Children.Count());
            Assert.Equal("howdy", result.Children.First().Name);
            Assert.Null(result.Children.First().Value);
            Assert.Equal("world", result.Children.Skip(1).First().Name);
            Assert.Equal("foo\"bar.com", result.Children.Skip(1).First().Value);
        }

        [Fact]
        public void EOFBeforeDone()
        {
            // Creating some lambda object.
            Assert.Throws<HyperlambdaException>(() => HyperlambdaParser.Parse(@"
howdy
world:""howdy world throws"));
        }

        [Fact]
        public void CharactersAfterClosingDoubleQuote()
        {
            // Creating some lambda object.
            Assert.Throws<HyperlambdaException>(() => HyperlambdaParser.Parse(@"
howdy
world:""howdy world""throws"));
        }

        [Fact]
        public void ReadSingleLineComment_01()
        {
            // Creating some lambda object.
            var result = HyperlambdaParser.Parse(@"
howdy
// This is a comment, and should be ignored!
world:foo""bar.com");

            // Asserts.
            Assert.Equal(2, result.Children.Count());
            Assert.Equal("howdy", result.Children.First().Name);
            Assert.Null(result.Children.First().Value);
            Assert.Equal("world", result.Children.Skip(1).First().Name);
            Assert.Equal("foo\"bar.com", result.Children.Skip(1).First().Value);
        }

        [Fact]
        public void ReadSingleLineComment_02()
        {
            // Creating some lambda object.
            var result = HyperlambdaParser.Parse(@"
howdy
// This is a comment, and should be ignored!
world:foo""bar.com
// NOTICE, no CR/LF at end of Hyperlambda");

            // Asserts.
            Assert.Equal(2, result.Children.Count());
            Assert.Equal("howdy", result.Children.First().Name);
            Assert.Null(result.Children.First().Value);
            Assert.Equal("world", result.Children.Skip(1).First().Name);
            Assert.Equal("foo\"bar.com", result.Children.Skip(1).First().Value);
        }

        [Fact]
        public void ReadSingleLineCommentNOTComment_01()
        {
            // Creating some lambda object.
            var result = HyperlambdaParser.Parse(@"
howdy
!// This is a comment, and should NOT be ignored!:foo
world:foo");

            // Asserts.
            Assert.Equal(3, result.Children.Count());
            Assert.Equal("howdy", result.Children.First().Name);
            Assert.Null(result.Children.First().Value);
            Assert.Equal("!// This is a comment, and should NOT be ignored!", result.Children.Skip(1).First().Name);
            Assert.Equal("foo", result.Children.Skip(1).First().Value);
            Assert.Equal("world", result.Children.Skip(2).First().Name);
            Assert.Equal("foo", result.Children.Skip(2).First().Value);
        }

        [Fact]
        public void ReadSingleLineCommentNOTComment_02()
        {
            // Creating some lambda object.
            var result = HyperlambdaParser.Parse(@"
howdy
/ This is a comment, and should NOT be ignored!:foo
world:foo");

            // Asserts.
            Assert.Equal(3, result.Children.Count());
            Assert.Equal("howdy", result.Children.First().Name);
            Assert.Null(result.Children.First().Value);
            Assert.Equal("/ This is a comment, and should NOT be ignored!", result.Children.Skip(1).First().Name);
            Assert.Equal("foo", result.Children.Skip(1).First().Value);
            Assert.Equal("world", result.Children.Skip(2).First().Name);
            Assert.Equal("foo", result.Children.Skip(2).First().Value);
        }

        [Fact]
        public void ReadMultiLineComment_01()
        {
            // Creating some lambda object.
            var result = HyperlambdaParser.Parse(@"
howdy
/* This is a comment, and should be ignored! */
world:foo""bar.com");

            // Asserts.
            Assert.Equal(2, result.Children.Count());
            Assert.Equal("howdy", result.Children.First().Name);
            Assert.Null(result.Children.First().Value);
            Assert.Equal("world", result.Children.Skip(1).First().Name);
            Assert.Equal("foo\"bar.com", result.Children.Skip(1).First().Value);
        }

        [Fact]
        public void ReadMultiLineComment_02()
        {
            // Creating some lambda object.
            var result = HyperlambdaParser.Parse(@"
howdy
/*
 * This is a comment, and should be ignored!
 */
world:foo""bar.com");

            // Asserts.
            Assert.Equal(2, result.Children.Count());
            Assert.Equal("howdy", result.Children.First().Name);
            Assert.Null(result.Children.First().Value);
            Assert.Equal("world", result.Children.Skip(1).First().Name);
            Assert.Equal("foo\"bar.com", result.Children.Skip(1).First().Value);
        }

        [Fact]
        public void ReadMultiLineComment_03_Throws()
        {
            // Creating some lambda object.
            Assert.Throws<HyperlambdaException>(() => HyperlambdaParser.Parse(@"
howdy
/*
 * This is a comment, and should be ignored!
 * Next line will make sure this throws!
 * /
world:foo""bar.com"));
        }

        [Fact]
        public void ReadMultiLineComment_04()
        {
            // Creating some lambda object.
            var result = HyperlambdaParser.Parse(@"
howdy
/*
 * This is a comment, and should be ignored!
 * / howdy world */
world:foo""bar.com");

            // Asserts.
            Assert.Equal(2, result.Children.Count());
            Assert.Equal("howdy", result.Children.First().Name);
            Assert.Null(result.Children.First().Value);
            Assert.Equal("world", result.Children.Skip(1).First().Name);
            Assert.Equal("foo\"bar.com", result.Children.Skip(1).First().Value);
        }

        [Fact]
        public void ReadMultiLineComment_05()
        {
            // Creating some lambda object.
            var result = HyperlambdaParser.Parse(@"
howdy
/**/
world:foo""bar.com");

            // Asserts.
            Assert.Equal(2, result.Children.Count());
            Assert.Equal("howdy", result.Children.First().Name);
            Assert.Null(result.Children.First().Value);
            Assert.Equal("world", result.Children.Skip(1).First().Name);
            Assert.Equal("foo\"bar.com", result.Children.Skip(1).First().Value);
        }

        [Fact]
        public void ReadMultiLineComment_06()
        {
            // Creating some lambda object.
            var result = HyperlambdaParser.Parse(@"
howdy
/*      */
world:foo""bar.com");

            // Asserts.
            Assert.Equal(2, result.Children.Count());
            Assert.Equal("howdy", result.Children.First().Name);
            Assert.Null(result.Children.First().Value);
            Assert.Equal("world", result.Children.Skip(1).First().Name);
            Assert.Equal("foo\"bar.com", result.Children.Skip(1).First().Value);
        }

        [Fact]
        public void CROnlySequqnece()
        {
            // Creating some lambda object.
            var lambda = HyperlambdaParser.Parse("foo\r");
            Assert.Single(lambda.Children);
            Assert.Equal("foo", lambda.Children.First().Name);
            Assert.Null(lambda.Children.First().Value);
        }

        [Fact]
        public void ReadOddSpacesThrows_01()
        {
            // Creating some lambda object.
            Assert.Throws<HyperlambdaException>(() => HyperlambdaParser.Parse(@"
foo
   // Next line throws!
  bar
"));
        }

        [Fact]
        public void ReadOddSpacesThrows_02()
        {
            // Creating some lambda object.
            Assert.Throws<HyperlambdaException>(() => HyperlambdaParser.Parse(@"
foo
   // Next line throws!
    bar
"));
        }

        [Fact]
        public void ReadNonClosedMultiLine_Throws()
        {
            // Creating some lambda object.
            Assert.Throws<HyperlambdaException>(() => HyperlambdaParser.Parse(@"
foo:@""howdy world
"));
        }

        [Fact]
        public void ReadMultiLineContainingDoubleQuotes()
        {
            // Creating some lambda object.
            var result = HyperlambdaParser.Parse(@"
howdy
world:@""foobar """" howdy""");

            // Asserts.
            Assert.Equal(2, result.Children.Count());
            Assert.Equal("howdy", result.Children.First().Name);
            Assert.Null(result.Children.First().Value);
            Assert.Equal("world", result.Children.Skip(1).First().Name);
            Assert.Equal("foobar \" howdy", result.Children.Skip(1).First().Value);
        }

        [Fact]
        public void ReadMultiLineContainingTwoConsecutiveCRLFSequences()
        {
            // Creating some lambda object.
            var result = HyperlambdaParser.Parse(@"
howdy
world:@""foo

bar""");

            // Asserts.
            Assert.Equal(2, result.Children.Count());
            Assert.Equal("howdy", result.Children.First().Name);
            Assert.Null(result.Children.First().Value);
            Assert.Equal("world", result.Children.Skip(1).First().Name);
            Assert.Equal("foo\r\n\r\nbar", result.Children.Skip(1).First().Value);
        }

        [Fact]
        public void ReadSingleLineWithEscapeCharacter()
        {
            // Creating some lambda object.
            var result = HyperlambdaParser.Parse(@"
howdy
world:""foobar \t howdy""");

            // Asserts.
            Assert.Equal(2, result.Children.Count());
            Assert.Equal("howdy", result.Children.First().Name);
            Assert.Null(result.Children.First().Value);
            Assert.Equal("world", result.Children.Skip(1).First().Name);
            Assert.Equal("foobar \t howdy", result.Children.Skip(1).First().Value);
        }

        [Fact]
        public void ReadSingleLineWithEscapedHexCharacter()
        {
            // Creating some lambda object.
            var result = HyperlambdaParser.Parse("\r\nhowdy\r\nworld:@\"foobar \xfefe howdy\"");

            // Asserts.
            Assert.Equal(2, result.Children.Count());
            Assert.Equal("howdy", result.Children.First().Name);
            Assert.Null(result.Children.First().Value);
            Assert.Equal("world", result.Children.Skip(1).First().Name);
            Assert.Equal("foobar \xfefe howdy", result.Children.Skip(1).First().Value);
        }

        [Fact]
        public void NodeWithOnlyCR_LF()
        {
            // Creating some lambda object.
            var result = HyperlambdaParser.Parse(@"howdy:""\r\n""");

            // Asserts.
            Assert.Single(result.Children);
            Assert.Equal("\r\n", result.Children.FirstOrDefault()?.Value);
        }

        [Fact]
        public void BadStringNotEscaped_THROWS()
        {
            // Creating some lambda object.
            Assert.Throws<HyperlambdaException>( () => HyperlambdaParser.Parse(@"howdy:""\\"));
        }

        [Fact]
        public void EscapedDoubleQuote()
        {
            // Creating some lambda object.
            var result = HyperlambdaParser.Parse(@"howdy:""\""""");

            // Asserts.
            Assert.Single(result.Children);
            Assert.Equal("\"", result.Children.FirstOrDefault()?.Value);
        }

        [Fact]
        public void EscapedCR()
        {
            // Creating some lambda object.
            var result = HyperlambdaParser.Parse(@"howdy:""\n""");

            // Asserts.
            Assert.Single(result.Children);
            Assert.Equal("\n", result.Children.FirstOrDefault()?.Value);
        }

        [Fact]
        public void ParseComments_01()
        {
            // Creating some lambda object and converting to Hyperlambda.
            var node = new Node();
            node.Add(new Node("..", "Comment here ..."));
            node.Add(new Node("foo", "bar"));
            var hl = HyperlambdaGenerator.GetHyperlambda(node.Children, false);

            // Asserts.
            Assert.Equal("..:Comment here ...\r\nfoo:bar\r\n", hl);
        }

        [Fact]
        public void ParseComments_02()
        {
            // Creating some lambda object and converting to Hyperlambda.
            var node = new Node();
            node.Add(new Node("..", "Comment here ..."));
            node.Add(new Node("foo", "bar"));
            var hl = HyperlambdaGenerator.GetHyperlambda(node.Children, true);

            // Asserts.
            Assert.Equal("\r\n// Comment here ...\r\nfoo:bar\r\n", hl);
        }

        [Fact]
        public void ParseComments_03()
        {
            // Creating some lambda object and converting to Hyperlambda.
            var node = new Node();
            node.Add(new Node("..", "Comment here ...\r\n... and its second line"));
            node.Add(new Node("foo", "bar"));
            var hl = HyperlambdaGenerator.GetHyperlambda(node.Children, true);

            // Asserts.
            Assert.Equal("\r\n/*\r\n * Comment here ...\r\n * ... and its second line\r\n */\r\nfoo:bar\r\n", hl);
        }

        [Fact]
        public void ParseComments_04()
        {
            var hl = "\r\n// Some comment\r\nfoo1:bar1\r\n\r\n/*\r\n * Howdy world,\r\n * this is comments ...\r\n */\r\nfoo2:bar2\r\n";
            var lambda = HyperlambdaParser.Parse(hl, true);
            var result = HyperlambdaGenerator.GetHyperlambda(lambda.Children, true);
            Assert.Equal(hl, result);
        }

        [Fact]
        public void ParseNonComment()
        {
            var hl = ".://\r\n";
            var lambda = HyperlambdaParser.Parse(hl, true);
            var result = HyperlambdaGenerator.GetHyperlambda(lambda.Children, true);
            Assert.Equal(hl, result);
        }
    }
}
