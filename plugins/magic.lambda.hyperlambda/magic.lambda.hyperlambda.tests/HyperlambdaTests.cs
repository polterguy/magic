/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Globalization;
using Xunit;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.node.extensions.hyperlambda;

namespace magic.lambda.hyperlambda.tests
{
    public class HyperlambdaTests
    {
        [Fact]
        public void Empty()
        {
            var result = HyperlambdaParser.Parse("").Children.ToList();
            Assert.Empty(result);
        }

        [Fact]
        public void Hyper2LambdaSignatureDocumentsCommentNodes()
        {
            var lambda = Common.Evaluate(@"slot.signature:hyper2lambda");
            var result = lambda.Children.First();
            var comments = result.Children
                .First(x => x.Name == "children")
                .Children
                .First(x => x.Name == "comments");

            Assert.Equal("Whether parser comment nodes should be preserved as [..] nodes with the comment text as value", comments.Children.First(x => x.Name == "description").GetEx<string>());
        }

        [Fact]
        public void Lambda2HyperSignatureDocumentsExpressionAndCommentsOnly()
        {
            var lambda = Common.Evaluate(@"slot.signature:lambda2hyper");
            var result = lambda.Children.First();
            var input = result.Children.First(x => x.Name == "input");
            var children = result.Children.First(x => x.Name == "children");
            var comments = children.Children.First(x => x.Name == "comments");

            Assert.True(input.Children.First(x => x.Name == "required").GetEx<bool>());
            Assert.Equal(SlotValueMode.Expression.ToString(), input.Children.First(x => x.Name == "mode").GetEx<string>());
            Assert.Equal("Whether generated Hyperlambda should include comments", comments.Children.First(x => x.Name == "description").GetEx<string>());
            Assert.DoesNotContain(children.Children, x => x.Name == "*");
        }

        [Fact]
        public void SingleNode()
        {
            var result = HyperlambdaParser.Parse("foo").Children.ToList();
            Assert.Single(result);
            Assert.Equal("foo", result.First().Name);
            Assert.Null(result.First().Value);
            Assert.Empty(result.First().Children);
        }

        [Fact]
        public void NodeWithEmptyValue()
        {
            var result = HyperlambdaParser.Parse("foo:").Children.ToList();
            Assert.Single(result);
            Assert.Equal("foo", result.First().Name);
            Assert.Equal("", result.First().Value);
            Assert.Empty(result.First().Children);
        }

        [Fact]
        public void NodeWithValue()
        {
            var result = HyperlambdaParser.Parse("foo:bar").Children.ToList();
            Assert.Single(result);
            Assert.Equal("foo", result.First().Name);
            Assert.Equal("bar", result.First().Value);
            Assert.Empty(result.First().Children);
        }

        [Fact]
        public void NodeWithColonValue()
        {
            var result = HyperlambdaParser.Parse(@"foo:"":""").Children.ToList();
            Assert.Single(result);
            Assert.Equal("foo", result.First().Name);
            Assert.Equal(":", result.First().Value);
            Assert.Empty(result.First().Children);
        }

        [Fact]
        public void NodeWithTypedValue()
        {
            var result = HyperlambdaParser.Parse("foo:int:5").Children.ToList();
            Assert.Single(result);
            Assert.Equal("foo", result.First().Name);
            Assert.Equal(5, result.First().Value);
            Assert.Empty(result.First().Children);
        }

        [Fact]
        public void TwoRootNodes()
        {
            var result = HyperlambdaParser.Parse("foo1:bar1\r\nfoo2:bar2").Children.ToList();
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
            var result = HyperlambdaParser.Parse("foo\r\n   bar").Children.ToList();
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
            var result = HyperlambdaParser.Parse("foo1\r\n   bar\r\nfoo2").Children.ToList();
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
            var result = HyperlambdaParser.Parse("foo1\r\n   bar1\r\n      bar2\r\n   bar3").Children.ToList();
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
        public void DoubleQuotedString()
        {
            var result = HyperlambdaParser.Parse(@"foo1:"" howdy world """).Children.ToList();
            Assert.Single(result);
            Assert.Equal("foo1", result.First().Name);
            Assert.Equal(" howdy world ", result.First().Value);
        }

        [Fact]
        public void SingleQuotedString()
        {
            var result = HyperlambdaParser.Parse("foo1:' howdy world '").Children.ToList();
            Assert.Single(result);
            Assert.Equal("foo1", result.First().Name);
            Assert.Equal(" howdy world ", result.First().Value);
        }

        [Fact]
        public void MultilineString()
        {
            var result = HyperlambdaParser.Parse("foo1:@\" howdy\r\nworld \"").Children.ToList();
            Assert.Single(result);
            Assert.Equal("foo1", result.First().Name);
            Assert.Equal(" howdy\r\nworld ", result.First().Value);
        }

        [Fact]
        public void SpacingError_Throws()
        {
            Assert.Throws<HyperlambdaException>(() => HyperlambdaParser.Parse("foo1\r\n bar1"));
        }

        [Fact]
        public void String2Lambda()
        {
            var signaler = Common.GetSignaler();
            var node = new Node("", "foo\n   bar");
            signaler.Signal("hyper2lambda", node);
            Assert.Equal("foo", node.Children.First().Name);
            Assert.Equal("bar", node.Children.First().Children.First().Name);
            Assert.Null(node.Value);
        }

        [Fact]
        public void Lambda2String()
        {
            var signaler = Common.GetSignaler();
            var node = new Node("");
            node.Add(new Node("foo"));
            node.Children.First().Add(new Node("bar"));
            signaler.Signal("lambda2hyper", node);
            Assert.Equal("foo\r\n   bar\r\n", node.Value);
        }

        [Fact]
        public void Lambda2HyperExpression()
        {
            var lambda = Common.Evaluate(@"
.foo
   foo1:bar1
lambda2hyper:x:-/*
");
            Assert.Equal("foo1:bar1\r\n", lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Lambda2HyperExpressionWithComments()
        {
            var lambda = Common.Evaluate(@"
.foo
   foo1:bar1
   ..:howdy world
lambda2hyper:x:-/*
   comments:true
");
            Assert.Equal("foo1:bar1\r\n\r\n// howdy world\r\n", lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Lambda2HyperExpressionWithMultilineComments()
        {
            var lambda = Common.Evaluate(@"
.foo
   foo1:bar1
   ..:""howdy world\r\nhowdy world 2""
lambda2hyper:x:-/*
   comments:true
");
            Assert.Equal("foo1:bar1\r\n\r\n/*\r\n * howdy world\r\n * howdy world 2\r\n */\r\n", lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Lambda2HyperThrows()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"lambda2hyper"));
        }

        [Fact]
        public void String2LambdaToString_01()
        {
            var hl = @"foo
   bar:int:57
      howdy:decimal:57
   barx
jo:dude
".Replace("\r", "").Replace("\n", "\r\n");
            var signaler = Common.GetSignaler();
            var node = new Node("", hl);
            signaler.Signal("hyper2lambda", node);
            Assert.Null(node.Value);
            signaler.Signal("lambda2hyper", node);
            Assert.Equal(hl, node.Value);
        }

        [Fact]
        public void String2LambdaToString_02()
        {
            var hl = @"foo
   bar:"" howdy\"" world ""
      howdy:@""
XXX""
   barx
jo:dude
".Replace("\r", "").Replace("\n", "\r\n");
            var signaler = Common.GetSignaler();
            var node = new Node("", hl);
            signaler.Signal("hyper2lambda", node);
            Assert.Null(node.Value);
            signaler.Signal("lambda2hyper", node);
            Assert.Equal(hl, node.Value);
        }

        [Fact]
        public void String2LambdaToString_03()
        {
            var hl = @"foo
   bar:""foo:bar""
      howdy:@""
XXX""
   barx
jo:dude
".Replace("\r", "").Replace("\n", "\r\n");
            var signaler = Common.GetSignaler();
            var node = new Node("", hl);
            signaler.Signal("hyper2lambda", node);
            Assert.Null(node.Value);
            signaler.Signal("lambda2hyper", node);
            Assert.Equal(hl, node.Value);
        }

        [Fact]
        public void String2LambdaToString_04()
        {
            var hl = @"foo
   bar:@""foo:bar
      """"jo:dude""""
""
      howdy:@""
XXX""
   barx
jo:dude
".Replace("\r", "").Replace("\n", "\r\n");
            var signaler = Common.GetSignaler();
            var node = new Node("", hl);
            signaler.Signal("hyper2lambda", node);
            Assert.Null(node.Value);
            signaler.Signal("lambda2hyper", node);
            Assert.Equal(hl, node.Value);
        }

        [Fact]
        public void String2LambdaToString_04_WithComments()
        {
            var hl = @"foo
   bar:int:57
      howdy:decimal:57
   barx
jo:dude
".Replace("\r", "").Replace("\n", "\r\n");
            var signaler = Common.GetSignaler();
            var node = new Node("", hl);
            signaler.Signal("hyper2lambda", node);
            Assert.Null(node.Value);
            signaler.Signal("lambda2hyper", node);
            Assert.Equal(hl, node.Value);
        }

        [Fact]
        public void MultilineCommentTest()
        {
            var hl = @"
/*
 * This is a comment
 */
foo
   bar:int:57
      howdy:decimal:57
   barx
jo:dude
".Replace("\r", "").Replace("\n", "\r\n");
            var signaler = Common.GetSignaler();
            var node = new Node("", hl);
            signaler.Signal("hyper2lambda", node);
            Assert.Null(node.Value);
            Assert.Equal("foo", node.Children.First().Name);
            Assert.Null(node.Children.First().Value);
            Assert.Equal("bar", node.Children.First().Children.First().Name);
            Assert.Equal(57, node.Children.First().Children.First().Value);
            Assert.Equal("howdy", node.Children.First().Children.First().Children.First().Name);
            Assert.Equal(57M, node.Children.First().Children.First().Children.First().Value);
            Assert.Equal("barx", node.Children.First().Children.Skip(1).First().Name);
            Assert.Equal("jo", node.Children.Skip(1).First().Name);
            Assert.Equal("dude", node.Children.Skip(1).First().Value);
        }

        [Fact]
        public void SingleLineCommentTest()
        {
            var hl = @"
foo
   bar:int:57
      howdy:decimal:57

   // This is a single line comment
   barx
jo:dude
".Replace("\r", "").Replace("\n", "\r\n");
            var signaler = Common.GetSignaler();
            var node = new Node("", hl);
            signaler.Signal("hyper2lambda", node);
            Assert.Null(node.Value);
            Assert.Equal("foo", node.Children.First().Name);
            Assert.Null(node.Children.First().Value);
            Assert.Equal("bar", node.Children.First().Children.First().Name);
            Assert.Equal(57, node.Children.First().Children.First().Value);
            Assert.Equal("howdy", node.Children.First().Children.First().Children.First().Name);
            Assert.Equal(57M, node.Children.First().Children.First().Children.First().Value);
            Assert.Equal("barx", node.Children.First().Children.Skip(1).First().Name);
            Assert.Equal("jo", node.Children.Skip(1).First().Name);
            Assert.Equal("dude", node.Children.Skip(1).First().Value);
        }

        [Fact]
        public void VerifySlots_MatchingCaseBody()
        {
            AssertMissingSlots(@"switch:foo
   case:foo
      missing.case.match", "missing.case.match");
        }

        [Fact]
        public void VerifySlots_NonMatchingCaseBody()
        {
            AssertMissingSlots(@"switch:foo
   case:bar
      missing.case.other", "missing.case.other");
        }

        [Fact]
        public void VerifySlots_DefaultBody()
        {
            AssertMissingSlots(@"switch:foo
   case:bar
      eval
   default
      missing.default", "missing.default");
        }

        [Fact]
        public void VerifySlots_TryBody()
        {
            AssertMissingSlots(@"try
   missing.try
.catch
   eval", "missing.try");
        }

        [Fact]
        public void VerifySlots_CatchBody()
        {
            AssertMissingSlots(@"try
   eval
.catch
   missing.catch", "missing.catch");
        }

        [Fact]
        public void VerifySlots_FinallyBodies()
        {
            AssertMissingSlots(@"try
   eval
.finally
   missing.finally
try
   eval
.catch
   eval
.finally
   missing.finally.after.catch",
                "missing.finally",
                "missing.finally.after.catch");
        }

        [Fact]
        public void VerifySlots_NestedBranchAndContinuationBodies()
        {
            AssertMissingSlots(@"switch:foo
   case:foo
      try
         eval
      .catch
         missing.nested.catch
      .finally
         switch:bar
            case:bar
               missing.nested.case",
                "missing.nested.catch",
                "missing.nested.case");
        }

        [Fact]
        public void VerifySlots_ValidBranchAndContinuationBodies()
        {
            var result = VerifySlots(@"switch:foo
   case:foo
      try
         eval
      .catch
         eval
      .finally
         eval
   default
      eval");
            Assert.True(result.Get<bool>());
            Assert.Empty(result.Children);
        }

        [Fact]
        public void VerifySlots_UnattachedContinuationDataIsIgnored()
        {
            var result = VerifySlots(@".catch
   missing.not.executable
.finally
   missing.also.not.executable");
            Assert.True(result.Get<bool>());
            Assert.Empty(result.Children);
        }

        static Node VerifySlots(string hyperlambda)
        {
            var node = new Node("", hyperlambda);
            Common.GetSignaler().Signal("hyperlambda.verify-slots", node);
            return node;
        }

        static void AssertMissingSlots(string hyperlambda, params string[] expected)
        {
            var result = VerifySlots(hyperlambda);
            Assert.False(result.Get<bool>());
            Assert.Equal(expected.Length, result.Children.Count());
            foreach (var name in expected)
                Assert.Contains(result.Children, x => x.Get<string>() == name);
        }

        [Fact]
        public void TypeConversion()
        {
            var hl = @"
.int:int:5
.decimal:decimal:5
.double:double:5
.bool:bool:true
.string:string:foo
.x:x:foo
";
            var signaler = Common.GetSignaler();
            var node = new Node("", hl);
            signaler.Signal("hyper2lambda", node);
            Assert.Equal(5, node.Children.First().Value);
            Assert.Equal(5M, node.Children.Skip(1).First().Value);
            Assert.Equal(5D, node.Children.Skip(2).First().Value);
            Assert.Equal(true, node.Children.Skip(3).First().Value);
            Assert.Equal("foo", node.Children.Skip(4).First().Value);
            Assert.True(node.Children.Skip(5).First().Value is Expression);
        }

        [Fact]
        public void NodeWithDateValue_02()
        {
            var result = HyperlambdaParser.Parse(@"
foo:date:'2019-07-10T08:12:39'").Children.ToList();
            Assert.Single(result);
            Assert.Equal("foo", result.First().Name);
            Assert.Equal(
                DateTime.Parse("2019-07-10T08:12:39", CultureInfo.InvariantCulture).ToUniversalTime(),
                result.First().Get<DateTime>().ToUniversalTime());
        }
    }
}
