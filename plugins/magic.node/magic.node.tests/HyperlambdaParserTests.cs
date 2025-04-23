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

        [Fact]
        public void Tokenize_01()
        {
            var hl = @"foo:bar";
            var tokenizer = new HyperlambdaTokenizer(new MemoryStream(Encoding.UTF8.GetBytes(hl)));
            var tokens = tokenizer.Tokens();
            Assert.Equal(3, tokens.Count);
            Assert.True(tokens.First().Type == TokenType.Name);
            Assert.True(tokens.Skip(1).First().Type == TokenType.Separator);
            Assert.True(tokens.Skip(2).First().Type == TokenType.Value);
        }

        [Fact]
        public void Tokenize_02()
        {
            var hl = "foo:bar\r\n";
            var tokenizer = new HyperlambdaTokenizer(new MemoryStream(Encoding.UTF8.GetBytes(hl)));
            var tokens = tokenizer.Tokens();
            Assert.Equal(4, tokens.Count);
            Assert.True(tokens.First().Type == TokenType.Name);
            Assert.True(tokens.Skip(1).First().Type == TokenType.Separator);
            Assert.True(tokens.Skip(2).First().Type == TokenType.Value);
            Assert.True(tokens.Skip(3).First().Type == TokenType.CRLF);
        }

        [Fact]
        public void Tokenize_03()
        {
            var hl = "foo:bar\n";
            var tokenizer = new HyperlambdaTokenizer(new MemoryStream(Encoding.UTF8.GetBytes(hl)));
            var tokens = tokenizer.Tokens();
            Assert.Equal(4, tokens.Count);
            Assert.True(tokens.First().Type == TokenType.Name);
            Assert.True(tokens.Skip(1).First().Type == TokenType.Separator);
            Assert.True(tokens.Skip(2).First().Type == TokenType.Value);
            Assert.True(tokens.Skip(3).First().Type == TokenType.CRLF);
        }

        [Fact]
        public void Tokenize_04()
        {
            var hl = "foo:bar\r";
            var tokenizer = new HyperlambdaTokenizer(new MemoryStream(Encoding.UTF8.GetBytes(hl)));
            var tokens = tokenizer.Tokens();
            Assert.Equal(4, tokens.Count);
            Assert.True(tokens.First().Type == TokenType.Name);
            Assert.True(tokens.Skip(1).First().Type == TokenType.Separator);
            Assert.True(tokens.Skip(2).First().Type == TokenType.Value);
            Assert.True(tokens.Skip(3).First().Type == TokenType.CRLF);
        }

        [Fact]
        public void Tokenize_05()
        {
            var hl = "foo:bar\rfoo:bar";
            var tokenizer = new HyperlambdaTokenizer(new MemoryStream(Encoding.UTF8.GetBytes(hl)));
            var tokens = tokenizer.Tokens();
            Assert.Equal(7, tokens.Count);
            Assert.True(tokens.First().Type == TokenType.Name);
            Assert.True(tokens.Skip(1).First().Type == TokenType.Separator);
            Assert.True(tokens.Skip(2).First().Type == TokenType.Value);
            Assert.True(tokens.Skip(3).First().Type == TokenType.CRLF);
            Assert.True(tokens.Skip(4).First().Type == TokenType.Name);
            Assert.True(tokens.Skip(5).First().Type == TokenType.Separator);
            Assert.True(tokens.Skip(6).First().Type == TokenType.Value);
        }

        [Fact]
        public void Tokenize_06()
        {
            var hl = "foo:bar\n   foo:bar";
            var tokenizer = new HyperlambdaTokenizer(new MemoryStream(Encoding.UTF8.GetBytes(hl)));
            var tokens = tokenizer.Tokens();
            Assert.Equal(8, tokens.Count);
            Assert.True(tokens.First().Type == TokenType.Name);
            Assert.True(tokens.Skip(1).First().Type == TokenType.Separator);
            Assert.True(tokens.Skip(2).First().Type == TokenType.Value);
            Assert.True(tokens.Skip(3).First().Type == TokenType.CRLF);
            Assert.True(tokens.Skip(4).First().Type == TokenType.Space);
            Assert.True(tokens.Skip(4).First().Value.Length == 3);
            Assert.True(tokens.Skip(5).First().Type == TokenType.Name);
            Assert.True(tokens.Skip(6).First().Type == TokenType.Separator);
            Assert.True(tokens.Skip(7).First().Type == TokenType.Value);
        }

        [Fact]
        public void Tokenize_07()
        {
            var hl = "foo:bar\n   foo:bar\r\n// Howdy world ...";
            var tokenizer = new HyperlambdaTokenizer(new MemoryStream(Encoding.UTF8.GetBytes(hl)));
            var tokens = tokenizer.Tokens();
            Assert.Equal(11, tokens.Count);
            Assert.True(tokens.First().Type == TokenType.Name);
            Assert.True(tokens.Skip(1).First().Type == TokenType.Separator);
            Assert.True(tokens.Skip(2).First().Type == TokenType.Value);
            Assert.True(tokens.Skip(3).First().Type == TokenType.CRLF);
            Assert.True(tokens.Skip(4).First().Type == TokenType.Space);
            Assert.True(tokens.Skip(4).First().Value.Length == 3);
            Assert.True(tokens.Skip(5).First().Type == TokenType.Name);
            Assert.True(tokens.Skip(6).First().Type == TokenType.Separator);
            Assert.True(tokens.Skip(7).First().Type == TokenType.Value);
            Assert.True(tokens.Skip(8).First().Type == TokenType.CRLF);
            Assert.True(tokens.Skip(9).First().Type == TokenType.SingleLineComment);
            Assert.True(tokens.Skip(9).First().Value == "Howdy world ...");
            Assert.True(tokens.Skip(10).First().Type == TokenType.CRLF);
        }

        [Fact]
        public void Tokenize_08()
        {
            var hl = "foo:bar\n   foo:bar\r\n//    ";
            var tokenizer = new HyperlambdaTokenizer(new MemoryStream(Encoding.UTF8.GetBytes(hl)));
            var tokens = tokenizer.Tokens();
            Assert.Equal(9, tokens.Count);
            Assert.True(tokens.First().Type == TokenType.Name);
            Assert.Equal("foo", tokens.First().Value);
            Assert.True(tokens.Skip(1).First().Type == TokenType.Separator);
            Assert.True(tokens.Skip(2).First().Type == TokenType.Value);
            Assert.Equal("bar", tokens.Skip(2).First().Value);
            Assert.True(tokens.Skip(3).First().Type == TokenType.CRLF);
            Assert.True(tokens.Skip(4).First().Type == TokenType.Space);
            Assert.True(tokens.Skip(4).First().Value.Length == 3);
            Assert.True(tokens.Skip(5).First().Type == TokenType.Name);
            Assert.True(tokens.Skip(6).First().Type == TokenType.Separator);
            Assert.True(tokens.Skip(7).First().Type == TokenType.Value);
            Assert.True(tokens.Skip(8).First().Type == TokenType.CRLF);
        }

        [Fact]
        public void Tokenize_09()
        {
            var hl = "foo:bar\n   foo:bar\r\n/*    Howdy world ... */\r\n/*\r\n * Thomas Hansen\r\n */";
            var tokenizer = new HyperlambdaTokenizer(new MemoryStream(Encoding.UTF8.GetBytes(hl)));
            var tokens = tokenizer.Tokens();
            Assert.Equal(13, tokens.Count);
            Assert.True(tokens.First().Type == TokenType.Name);
            Assert.Equal("foo", tokens.First().Value);
            Assert.True(tokens.Skip(1).First().Type == TokenType.Separator);
            Assert.True(tokens.Skip(2).First().Type == TokenType.Value);
            Assert.Equal("bar", tokens.Skip(2).First().Value);
            Assert.True(tokens.Skip(3).First().Type == TokenType.CRLF);
            Assert.True(tokens.Skip(4).First().Type == TokenType.Space);
            Assert.True(tokens.Skip(4).First().Value.Length == 3);
            Assert.True(tokens.Skip(5).First().Type == TokenType.Name);
            Assert.True(tokens.Skip(6).First().Type == TokenType.Separator);
            Assert.True(tokens.Skip(7).First().Type == TokenType.Value);
            Assert.True(tokens.Skip(8).First().Type == TokenType.CRLF);
            Assert.Equal("Howdy world ...", tokens.Skip(9).First().Value);
            Assert.True(tokens.Skip(10).First().Type == TokenType.CRLF);
            Assert.Equal("Thomas Hansen", tokens.Skip(11).First().Value);
            Assert.True(tokens.Skip(12).First().Type == TokenType.CRLF);
        }

        [Fact]
        public void Tokenize_10()
        {
            var hl = "foo:bar\n   foo:bar\r\n/*    Howdy world ...\r   *   thomas   \n  hansen */\r\n/*\r\n * Thomas Hansen\r\n */";
            var tokenizer = new HyperlambdaTokenizer(new MemoryStream(Encoding.UTF8.GetBytes(hl)));
            var tokens = tokenizer.Tokens();
            Assert.Equal(13, tokens.Count);
            Assert.True(tokens.First().Type == TokenType.Name);
            Assert.Equal("foo", tokens.First().Value);
            Assert.True(tokens.Skip(1).First().Type == TokenType.Separator);
            Assert.True(tokens.Skip(2).First().Type == TokenType.Value);
            Assert.Equal("bar", tokens.Skip(2).First().Value);
            Assert.True(tokens.Skip(3).First().Type == TokenType.CRLF);
            Assert.True(tokens.Skip(4).First().Type == TokenType.Space);
            Assert.True(tokens.Skip(4).First().Value.Length == 3);
            Assert.True(tokens.Skip(5).First().Type == TokenType.Name);
            Assert.True(tokens.Skip(6).First().Type == TokenType.Separator);
            Assert.True(tokens.Skip(7).First().Type == TokenType.Value);
            Assert.True(tokens.Skip(8).First().Type == TokenType.CRLF);
            Assert.Equal("Howdy world ...\r\nthomas\r\nhansen", tokens.Skip(9).First().Value);
            Assert.True(tokens.Skip(10).First().Type == TokenType.CRLF);
            Assert.Equal("Thomas Hansen", tokens.Skip(11).First().Value);
            Assert.True(tokens.Skip(12).First().Type == TokenType.CRLF);
        }

        [Fact]
        public void Tokenize_11()
        {
            var hl = "   \r \n     \r\nfoo:  bar  \n   foo:bar\r\n\n  \r     \r\n/*    Howdy world ...\r   *   thomas   \n  hansen */\r\n/*\r\n * Thomas Hansen\r\n */";
            var tokenizer = new HyperlambdaTokenizer(new MemoryStream(Encoding.UTF8.GetBytes(hl)));
            var tokens = tokenizer.Tokens();
            Assert.Equal(13, tokens.Count);
            Assert.True(tokens.First().Type == TokenType.Name);
            Assert.Equal("foo", tokens.First().Value);
            Assert.True(tokens.Skip(1).First().Type == TokenType.Separator);
            Assert.True(tokens.Skip(2).First().Type == TokenType.Value);
            Assert.Equal("bar", tokens.Skip(2).First().Value);
            Assert.True(tokens.Skip(3).First().Type == TokenType.CRLF);
            Assert.True(tokens.Skip(4).First().Type == TokenType.Space);
            Assert.True(tokens.Skip(4).First().Value.Length == 3);
            Assert.True(tokens.Skip(5).First().Type == TokenType.Name);
            Assert.True(tokens.Skip(6).First().Type == TokenType.Separator);
            Assert.True(tokens.Skip(7).First().Type == TokenType.Value);
            Assert.True(tokens.Skip(8).First().Type == TokenType.CRLF);
            Assert.Equal("Howdy world ...\r\nthomas\r\nhansen", tokens.Skip(9).First().Value);
            Assert.True(tokens.Skip(10).First().Type == TokenType.CRLF);
            Assert.Equal("Thomas Hansen", tokens.Skip(11).First().Value);
            Assert.True(tokens.Skip(12).First().Type == TokenType.CRLF);
        }

        [Fact]
        public void Tokenize_12()
        {
            var hl = "   \r \n     \r\n\r\n\n\rfoo:  bar  \n   foo:bar\r\n\n  \r     \r\n/*    Howdy world ...\r   *   thomas   \n  hansen */\r\n/*\r\n * Thomas Hansen\r\n */";
            var tokenizer = new HyperlambdaTokenizer(new MemoryStream(Encoding.UTF8.GetBytes(hl)));
            var tokens = tokenizer.Tokens();
            Assert.Equal(13, tokens.Count);
            Assert.True(tokens.First().Type == TokenType.Name);
            Assert.Equal("foo", tokens.First().Value);
            Assert.True(tokens.Skip(1).First().Type == TokenType.Separator);
            Assert.True(tokens.Skip(2).First().Type == TokenType.Value);
            Assert.Equal("bar", tokens.Skip(2).First().Value);
            Assert.True(tokens.Skip(3).First().Type == TokenType.CRLF);
            Assert.True(tokens.Skip(4).First().Type == TokenType.Space);
            Assert.True(tokens.Skip(4).First().Value.Length == 3);
            Assert.True(tokens.Skip(5).First().Type == TokenType.Name);
            Assert.True(tokens.Skip(6).First().Type == TokenType.Separator);
            Assert.True(tokens.Skip(7).First().Type == TokenType.Value);
            Assert.True(tokens.Skip(8).First().Type == TokenType.CRLF);
            Assert.Equal("Howdy world ...\r\nthomas\r\nhansen", tokens.Skip(9).First().Value);
            Assert.True(tokens.Skip(10).First().Type == TokenType.CRLF);
            Assert.Equal("Thomas Hansen", tokens.Skip(11).First().Value);
            Assert.True(tokens.Skip(12).First().Type == TokenType.CRLF);
        }

        [Fact]
        public void Tokenize_13()
        {
            var hl = "/*\r * howdy\n */\r\n\n\r/* howdy */";
            var tokenizer = new HyperlambdaTokenizer(new MemoryStream(Encoding.UTF8.GetBytes(hl)));
            var tokens = tokenizer.Tokens();
            Assert.Equal(4, tokens.Count);
        }

        [Fact]
        public void Tokenize_14()
        {
            var lhs = new Token(TokenType.CRLF, "\r\n");
            var rhs = new Token(TokenType.CRLF, "\r\n");
            Assert.Equal(lhs, rhs);
            Assert.NotEqual(lhs, new object());
            Assert.Equal(lhs.GetHashCode(), rhs.GetHashCode());
        }

        [Fact]
        public void Tokenize_15()
        {
            var hl = "foo\r\n";
            var tokenizer = new HyperlambdaTokenizer(new MemoryStream(Encoding.UTF8.GetBytes(hl)));
            var tokens = tokenizer.Tokens();
            Assert.Equal(2, tokens.Count);
            Assert.Equal("foo", tokens.First().Value);
            Assert.Equal("\r\n", tokens.Skip(1).First().Value);
        }

        [Fact]
        public void Tokenize_16()
        {
            var hl = "foo\n";
            var tokenizer = new HyperlambdaTokenizer(new MemoryStream(Encoding.UTF8.GetBytes(hl)));
            var tokens = tokenizer.Tokens();
            Assert.Equal(2, tokens.Count);
            Assert.Equal("foo", tokens.First().Value);
            Assert.Equal("\r\n", tokens.Skip(1).First().Value);
        }

        [Fact]
        public void Tokenize_17()
        {
            var hl = "foo\r";
            var tokenizer = new HyperlambdaTokenizer(new MemoryStream(Encoding.UTF8.GetBytes(hl)));
            var tokens = tokenizer.Tokens();
            Assert.Equal(2, tokens.Count);
            Assert.Equal("foo", tokens.First().Value);
            Assert.Equal("\r\n", tokens.Skip(1).First().Value);
        }

        [Fact]
        public void Tokenize_18()
        {
            var hl = ":foo";
            var tokenizer = new HyperlambdaTokenizer(new MemoryStream(Encoding.UTF8.GetBytes(hl)));
            var tokens = tokenizer.Tokens();
            Assert.Equal(3, tokens.Count);
            Assert.Equal("", tokens.First().Value);
            Assert.Equal(TokenType.Name, tokens.First().Type);
            Assert.Equal(":", tokens.Skip(1).First().Value);
            Assert.Equal(TokenType.Separator, tokens.Skip(1).First().Type);
            Assert.Equal("foo", tokens.Skip(2).First().Value);
            Assert.Equal(TokenType.Value, tokens.Skip(2).First().Type);
        }

        [Fact]
        public void Tokenize_19()
        {
            var hl = ":foo:howdy";
            var tokenizer = new HyperlambdaTokenizer(new MemoryStream(Encoding.UTF8.GetBytes(hl)));
            var tokens = tokenizer.Tokens();
            Assert.Equal(5, tokens.Count);

            Assert.Equal("", tokens.First().Value);
            Assert.Equal(TokenType.Name, tokens.First().Type);

            Assert.Equal(":", tokens.Skip(1).First().Value);
            Assert.Equal(TokenType.Separator, tokens.Skip(1).First().Type);

            Assert.Equal("foo", tokens.Skip(2).First().Value);
            Assert.Equal(TokenType.Type, tokens.Skip(2).First().Type);

            Assert.Equal(":", tokens.Skip(3).First().Value);
            Assert.Equal(TokenType.Separator, tokens.Skip(3).First().Type);

            Assert.Equal("howdy", tokens.Skip(4).First().Value);
            Assert.Equal(TokenType.Value, tokens.Skip(4).First().Type);
        }

        [Fact]
        public void Tokenize_20()
        {
            var hl = "// Thomas Hansen      ";
            var tokenizer = new HyperlambdaTokenizer(new MemoryStream(Encoding.UTF8.GetBytes(hl)));
            var tokens = tokenizer.Tokens();
            Assert.Equal(2, tokens.Count);
            Assert.True(tokens.First().Type == TokenType.SingleLineComment);
            Assert.Equal("Thomas Hansen", tokens.First().Value);

            // Notice, comments have CR/LF automatically appended to the list of tokens afterwards.
            Assert.True(tokens.Skip(1).First().Type == TokenType.CRLF);
            Assert.Equal("\r\n", tokens.Skip(1).First().Value);
        }

        [Fact]
        public void Tokenize_21()
        {
            var hl = "@\"foo\"";
            var tokenizer = new HyperlambdaTokenizer(new MemoryStream(Encoding.UTF8.GetBytes(hl)));
            var tokens = tokenizer.Tokens();
            Assert.Single(tokens);
            Assert.True(tokens.First().Type == TokenType.Name);
            Assert.Equal("foo", tokens.First().Value);
        }

        [Fact]
        public void Tokenize_22()
        {
            var hl = "@\"foo\rf\ng\"";
            var tokenizer = new HyperlambdaTokenizer(new MemoryStream(Encoding.UTF8.GetBytes(hl)));
            var tokens = tokenizer.Tokens();
            Assert.Single(tokens);
            Assert.True(tokens.First().Type == TokenType.Name);
            Assert.Equal("foo\rf\ng", tokens.First().Value);
        }

        [Fact]
        public void Tokenize_23()
        {
            var hl = "foo:\r";
            var tokenizer = new HyperlambdaTokenizer(new MemoryStream(Encoding.UTF8.GetBytes(hl)));
            var tokens = tokenizer.Tokens();
            Assert.Equal(4, tokens.Count);
            Assert.True(tokens.First().Type == TokenType.Name);
            Assert.Equal("foo", tokens.First().Value);
            Assert.True(tokens.Skip(1).First().Type == TokenType.Separator);
            Assert.True(tokens.Skip(2).First().Type == TokenType.Value);
            Assert.Equal("", tokens.Skip(2).First().Value);
            Assert.True(tokens.Skip(3).First().Type == TokenType.CRLF);
        }

        [Fact]
        public void Tokenize_24()
        {
            // Creating some lambda object.
            Assert.Throws<HyperlambdaException>(() => HyperlambdaParser.Parse("foo:@\"bar\"ERROR").Children.ToList());
        }

        [Fact]
        public void Tokenize_25()
        {
            // Creating some lambda object.
            Assert.Throws<HyperlambdaException>(() => HyperlambdaParser.Parse("foo:\"bar\"ERROR").Children.ToList());
        }

        [Fact]
        public void Tokenize_26_THROWS()
        {
            // Creating some lambda object.
            Assert.Throws<HyperlambdaException>(() => HyperlambdaParser.Parse("// howdy\r   .:x", true).Children.ToList());
        }

        [Fact]
        public void Tokenize_27_THROWS()
        {
            // Creating some lambda object.
            Assert.Throws<HyperlambdaException>(() => HyperlambdaParser.Parse("\"\\").Children.ToList());
        }

        [Fact]
        public void Tokenize_28()
        {
            var hl = "\"\\\"\"";
            var tokenizer = new HyperlambdaTokenizer(new MemoryStream(Encoding.UTF8.GetBytes(hl)));
            var tokens = tokenizer.Tokens();
            Assert.Single(tokens);
            Assert.True(tokens.First().Type == TokenType.Name);
            Assert.Equal("\"", tokens.First().Value);
        }

        [Fact]
        public void Tokenize_29()
        {
            var hl = "/*\r * thomas \r * \r * hansen \r */";
            var tokenizer = new HyperlambdaTokenizer(new MemoryStream(Encoding.UTF8.GetBytes(hl)));
            var tokens = tokenizer.Tokens();
            Assert.Equal(2, tokens.Count);
            Assert.True(tokens.First().Type == TokenType.MultiLineComment);
            Assert.Equal("thomas\r\n\r\nhansen", tokens.First().Value);
            Assert.Equal(TokenType.CRLF, tokens.Skip(1).First().Type);
        }

        [Fact]
        public void Tokenize_30()
        {
            var hl = "/*\r * thomas \r *\r * hansen \r */";
            var tokenizer = new HyperlambdaTokenizer(new MemoryStream(Encoding.UTF8.GetBytes(hl)));
            var tokens = tokenizer.Tokens();
            Assert.Equal(2, tokens.Count);
            Assert.True(tokens.First().Type == TokenType.MultiLineComment);
            Assert.Equal("thomas\r\n\r\nhansen", tokens.First().Value);
            Assert.Equal(TokenType.CRLF, tokens.Skip(1).First().Type);
        }
    }
}
