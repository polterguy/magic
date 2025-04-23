/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using Xunit;
using magic.node.extensions;
using magic.node.extensions.hyperlambda;

namespace magic.node.tests
{
    /*
     * Unit tests for lambda expressions.
     */
    public class ExpressionTests
    {
        [Fact]
        public void Simple()
        {
            // Creating an expression.
            var x = new Expression("foo/bar");

            // Asserts.
            Assert.Equal(2, x.Iterators.Count());
            Assert.Equal("foo", x.Iterators.First().Value);
            Assert.Equal("bar", x.Iterators.Skip(1).First().Value);
        }

        [Fact]
        public void ExpToStringAndHashCode()
        {
            // Creating an expression.
            var x = new Expression("foo/bar");

            // Asserts.
            Assert.Equal("foo/bar", x.ToString());
            Assert.Equal("foo/bar".GetHashCode(), x.GetHashCode());
            Assert.True(x.Equals(new Expression("foo/bar")));
            Assert.False(x.Equals(5));
            Assert.Equal(x.Iterators.First().ToString().GetHashCode(), x.Iterators.First().GetHashCode());
            Assert.False(x.Iterators.First().Equals(x.Iterators.Skip(1).First()));
            Assert.True(x.Iterators.First().Equals(new Expression("foo").Iterators.First()));
            Assert.False(x.Iterators.First().Equals(new object()));
        }

        [Fact]
        public void Evaluate_01()
        {
            // Creating some example lambda to run our expression on.
            var hl = @"foo
   bar
   xxx
   bar";
            var lambda = HyperlambdaParser.Parse(hl).Children;

            // Creating an expression, and evaluating it on above lambda.
            var x = new Expression("foo/*/bar");
            var result = x.Evaluate(lambda.First()).ToList();

            // Asserts.
            Assert.Equal(2, result.Count);
            Assert.Equal("bar", result.First().Name);
            Assert.Equal("bar", result.Skip(1).First().Name);
        }

        [Fact]
        public void Evaluate_Throws()
        {
            // Notice, unless identity node's value is an expression, Evaluate will throw.
            Assert.Throws<HyperlambdaException>(() => new Node().Evaluate());
        }

        [Fact]
        public void Evaluate_02()
        {
            // Creating some example lambda to run our expression on.
            // Notice, making sure we use Mac OS X logic for carriage returns.
            var hl = "foo\n   bar1\n   bar2\nfoo\n   bar3";
            var lambda = HyperlambdaParser.Parse(hl);

            // Creating an expression, and evaluating it on above lambda.
            var x = new Expression("*/foo/*");
            var result = x.Evaluate(lambda).ToList();

            // Asserts.
            Assert.Equal(3, result.Count);
            Assert.Equal("bar1", result.First().Name);
            Assert.Equal("bar2", result.Skip(1).First().Name);
            Assert.Equal("bar3", result.Skip(2).First().Name);
        }

        [Fact]
        public void Evaluate_03()
        {
            // Creating some example lambda to run our expression on.
            var hl = @"foo
   bar
   xxx
   bar";
            var lambda = HyperlambdaParser.Parse(hl).Children;

            // Creating an expression, and evaluating it on above lambda.
            var x = new Expression("../0/**");
            var result = x.Evaluate(lambda.First()).ToList();

            // Asserts.
            Assert.Equal(4, result.Count);
            Assert.Equal("foo", result.First().Name);
            Assert.Equal("bar", result.Skip(1).First().Name);
            Assert.Equal("xxx", result.Skip(2).First().Name);
            Assert.Equal("bar", result.Skip(3).First().Name);
        }

        [Fact]
        public void Evaluate_04()
        {
            // Creating some example lambda to run our expression on.
            var hl = @"foo:node:@""foo:bar""";
            var lambda = HyperlambdaParser.Parse(hl);

            // Creating an expression, and evaluating it on above lambda.
            var x = new Expression("../0/#");
            var result = x.Evaluate(lambda);

            // Asserts.
            Assert.Single(result);
            var str = result.First().ToHyperlambda();
            Assert.Equal("\"\"\r\n   foo:bar\r\n", str);
        }

        [Fact]
        public void Evaluate_05()
        {
            // Creating some example lambda to run our expression on.
            var hl = @"foo
   bar
   xxx
   bar";
            var lambda = HyperlambdaParser.Parse(hl).Children;

            // Creating an expression, and evaluating it on above lambda.
            var x = new Expression("../*/non-existing/..");
            var result = x.Evaluate(lambda.First()).ToList();
            Assert.Empty(result);
        }

        [Fact]
        public void Evaluate_06()
        {
            // Creating some example lambda to run our expression on.
            var hl = @"foo
   1";
            var lambda = HyperlambdaParser.Parse(hl).Children;

            // Creating an expression, and evaluating it on above lambda.
            var x = new Expression("../**/\\1");
            var result = x.Evaluate(lambda.First()).ToList();
            Assert.Single(result);
            Assert.Equal("1", result.First().Name);
        }

        [Fact]
        public void Evaluate_07()
        {
            // Creating some example lambda to run our expression on.
            var hl = @"foo
   """"";
            var lambda = HyperlambdaParser.Parse(hl).Children;

            // Creating an expression, and evaluating it on above lambda.
            var x = new Expression("../**/foo/*/");
            var result = x.Evaluate(lambda.First()).ToList();
            Assert.Single(result);
            Assert.Equal("", result.First().Name);
        }

        [Fact]
        public void Evaluate_08()
        {
            // Creating some example lambda to run our expression on.
            var hl = @"foo
   how/dy";
            var lambda = HyperlambdaParser.Parse(hl).Children;

            // Creating an expression, and evaluating it on above lambda.
            var x = new Expression("../**/\"how/dy\"");
            var result = x.Evaluate(lambda.First()).ToList();
            Assert.Single(result);
            Assert.Equal("how/dy", result.First().Name);
        }

        [Fact]
        public void Evaluate_09()
        {
            // Creating some example lambda to run our expression on.
            var hl = @"foo
   /howdy";
            var lambda = HyperlambdaParser.Parse(hl).Children;

            // Creating an expression, and evaluating it on above lambda.
            var x = new Expression("../**/\"/howdy\"");
            var result = x.Evaluate(lambda.First()).ToList();
            Assert.Single(result);
            Assert.Equal("/howdy", result.First().Name);
        }

        [Fact]
        public void Evaluate_10()
        {
            // Creating some example lambda to run our expression on.
            var hl = @"foo
   howdy:";
            var lambda = HyperlambdaParser.Parse(hl).Children;

            // Creating an expression, and evaluating it on above lambda.
            var x = new Expression("../**/howdy/=");
            var result = x.Evaluate(lambda.First()).ToList();
            Assert.Single(result);
            Assert.Equal("howdy", result.First().Name);
        }

        [Fact]
        public void Evaluate_11()
        {
            // Creating some example lambda to run our expression on.
            var hl = @"foo
   howdy";
            var lambda = HyperlambdaParser.Parse(hl).Children;

            // Creating an expression, and evaluating it on above lambda.
            var x = new Expression("../**/howdy/=");
            var result = x.Evaluate(lambda.First()).ToList();
            Assert.Single(result);
            Assert.Equal("howdy", result.First().Name);
        }

        [Fact]
        public void Evaluate_12()
        {
            // Creating some example lambda to run our expression on.
            var hl = @"foo
   howdy";
            var lambda = HyperlambdaParser.Parse(hl).Children;

            // Creating an expression, and evaluating it on above lambda.
            var x = new Expression("../**/\"howdy\"/=");
            var result = x.Evaluate(lambda.First()).ToList();
            Assert.Single(result);
            Assert.Equal("howdy", result.First().Name);
        }

        [Fact]
        public void Evaluate_13()
        {
            // Creating some example lambda to run our expression on.
            var hl = @"foo
   bar
   xxx
   bar";
            var lambda = HyperlambdaParser.Parse(hl).Children;

            // Creating an expression, and evaluating it on above lambda.
            var x = new Expression("../12/..");
            var result = x.Evaluate(lambda.First()).ToList();

            // Asserts.
            Assert.Empty(result);
        }

        [Fact]
        public void Evaluate_14()
        {
            // Creating some example lambda to run our expression on.
            var hl = @"foo
   bar
   xxx
   bar";
            var lambda = HyperlambdaParser.Parse(hl).Children;

            // Creating an expression, and evaluating it on above lambda.
            var x = new Expression("../5/..");
            var result = x.Evaluate(lambda.First()).ToList();

            // Asserts.
            Assert.Empty(result);
        }

        [Fact]
        public void Evaluate_15()
        {
            // Creating some example lambda to run our expression on.
            var hl = @"foo
   bar
   xxx
   bar";
            var lambda = HyperlambdaParser.Parse(hl).Children;

            // Creating an expression, and evaluating it on above lambda.
            var x = new Expression("../*/ERROR/@foo");
            var result = x.Evaluate(lambda.First()).ToList();

            // Asserts.
            Assert.Empty(result);
        }

        [Fact]
        public void Evaluate_16()
        {
            // Creating some example lambda to run our expression on.
            var hl = @"foo
   bar
   xxx
   bar";
            var lambda = HyperlambdaParser.Parse(hl).Children;

            // Creating an expression, and evaluating it on above lambda.
            var x = new Expression("../*/foo/@ERROR");
            var result = x.Evaluate(lambda.First()).ToList();

            // Asserts.
            Assert.Empty(result);
        }

        [Fact]
        public void Evaluate_17()
        {
            // Creating some example lambda to run our expression on.
            var hl = @"foo
   bar
   xxx
   bar";
            var lambda = HyperlambdaParser.Parse(hl).Children;

            // Creating an expression, and evaluating it on above lambda.
            var x = new Expression("../*/foo/*/xxx/@bar");
            var result = x.Evaluate(lambda.First()).ToList();

            // Asserts.
            Assert.Single(result);
            Assert.Equal("bar", result.FirstOrDefault()?.Name);
        }

        [Fact]
        public void Evaluate_18()
        {
            // Creating some example lambda to run our expression on.
            var hl = @"foo:x:*/bar
   bar:SUCCESS
   xxx
   barXXX";
            var lambda = HyperlambdaParser.Parse(hl).Children.FirstOrDefault();
            var result = lambda.Evaluate();
            Assert.Single(result);
            Assert.Equal("SUCCESS", result.FirstOrDefault()?.Value);
        }

        [Fact]
        public void Evaluate_19_THROWS()
        {
            // Creating some example lambda to run our expression on.
            var hl = @"foo:*/bar
   bar:SUCCESS
   xxx
   barXXX";
            var lambda = HyperlambdaParser.Parse(hl).Children.FirstOrDefault();
            Assert.Throws<HyperlambdaException>(() => lambda.Evaluate());
        }

        [Fact]
        public void ToString_01()
        {
            // Creating some example lambda to run our expression on.
            // Creating an expression, and evaluating it on above lambda.
            var x = new Expression("../**/foo");
            Assert.Equal("../**/foo", x.Value);
        }

        [Fact]
        public void ToString_02()
        {
            // Creating some example lambda to run our expression on.
            // Creating an expression, and evaluating it on above lambda.
            var x = new Expression("../**/\"how/dy\"");
            Assert.Equal("../**/\"how/dy\"", x.Value);
        }

        [Fact]
        public void ToString_03()
        {
            // Creating some example lambda to run our expression on.
            // Creating an expression, and evaluating it on above lambda.
            var x = new Expression("../**/\"howdy\"");
            Assert.Equal("../**/howdy", x.Value);
        }

        [Fact]
        public void ParentIterator()
        {
            // Creating some example lambda to run our expression on.
            var hl = "foo\n   bar\n   bar";
            var lambda = HyperlambdaParser.Parse(hl).Children;

            // Creating an expression, and evaluating it on above lambda.
            var x = new Expression("foo/*/bar/.");
            var result = x.Evaluate(lambda.First()).ToList();

            // Asserts.
            Assert.Single(result);
            Assert.Equal("foo", result.First().Name);
        }

        [Fact]
        public void VariableIterator()
        {
            // Creating some example lambda to run our expression on.
            var hl = "foo\n   bar\n   bar";
            var lambda = HyperlambdaParser.Parse(hl);

            // Creating an expression, and evaluating it on above lambda.
            var x = new Expression("foo/1/@foo");
            var result = x.Evaluate(lambda.Children.First()).ToList();

            // Asserts.
            Assert.Single(result);
            Assert.Equal("foo", result.First().Name);
        }

        [Fact]
        public void SubscriptIterator()
        {
            // Creating some example lambda to run our expression on.
            var hl = @"foo
   bar:error
   bar:success";
            var lambda = HyperlambdaParser.Parse(hl);

            // Creating an expression, and evaluating it on above lambda.
            var x = new Expression("foo/*/[1,1]");
            var result = x.Evaluate(lambda.Children.First()).ToList();

            // Asserts.
            Assert.Single(result);
            Assert.Equal("bar", result.First().Name);
            Assert.Equal("success", result.First().Value);
        }

        [Fact]
        public void NextIterator()
        {
            // Creating some example lambda to run our expression on.
            var hl = "foo\n   bar1\n   bar2";
            var lambda = HyperlambdaParser.Parse(hl).Children;

            // Creating an expression, and evaluating it on above lambda.
            var x = new Expression("foo/*/bar1/+");
            var result = x.Evaluate(lambda.First()).ToList();

            // Asserts.
            Assert.Single(result);
            Assert.Equal("bar2", result.First().Name);
        }

        [Fact]
        public void PreviousIterator()
        {
            // Creating some example lambda to run our expression on.
            var hl = "foo\n   bar1\n   bar2";
            var lambda = HyperlambdaParser.Parse(hl).Children;

            // Creating an expression, and evaluating it on above lambda.
            var x = new Expression("foo/*/bar2/-");
            var result = x.Evaluate(lambda.First()).ToList();

            // Asserts.
            Assert.Single(result);
            Assert.Equal("bar1", result.First().Name);
        }

        [Fact]
        public void PreviousIteratorRoundtrip()
        {
            // Creating some example lambda to run our expression on.
            var hl = "foo\n   bar1\n   bar2";
            var lambda = HyperlambdaParser.Parse(hl).Children;

            // Creating an expression, and evaluating it on above lambda.
            var x = new Expression("foo/*/bar1/-");
            var result = x.Evaluate(lambda.First()).ToList();

            // Asserts.
            Assert.Single(result);
            Assert.Equal("bar2", result.First().Name);
        }

        [Fact]
        public void NextIteratorRoundtrip()
        {
            // Creating some example lambda to run our expression on.
            var hl = "foo\n   bar1\n   bar2";
            var lambda = HyperlambdaParser.Parse(hl).Children;

            // Creating an expression, and evaluating it on above lambda.
            var x = new Expression("foo/*/bar2/+");
            var result = x.Evaluate(lambda.First()).ToList();

            // Asserts.
            Assert.Single(result);
            Assert.Equal("bar1", result.First().Name);
        }

        [Fact]
        public void EqualIterator_01()
        {
            // Creating some example lambda to run our expression on.
            var hl = "foo\n   bar1:xxx\n   bar1:yyy";
            var lambda = HyperlambdaParser.Parse(hl).Children;

            // Creating an expression, and evaluating it on above lambda.
            var x = new Expression("foo/*/bar1/=xxx");
            var result = x.Evaluate(lambda.First()).ToList();

            // Asserts.
            Assert.Single(result);
            Assert.Equal("bar1", result.First().Name);
            Assert.Equal("xxx", result.First().Value);
        }

        [Fact]
        public void EqualIteratorConversion_02()
        {
            // Creating some example lambda to run our expression on.
            var hl = "foo\n   bar1:int:5\n   bar1:yyy";
            var lambda = HyperlambdaParser.Parse(hl).Children;

            // Creating an expression, and evaluating it on above lambda.
            var x = new Expression("foo/*/bar1/=5");
            var result = x.Evaluate(lambda.First()).ToList();

            // Asserts.
            Assert.Single(result);
            Assert.Equal("bar1", result.First().Name);
        }

        [Fact]
        public void EqualIteratorConversion_03()
        {
            // Creating some example lambda to run our expression on.
            var hl = "foo\n   bar1:bool:true\n   bar1:yyy";
            var lambda = HyperlambdaParser.Parse(hl).Children;

            // Creating an expression, and evaluating it on above lambda.
            var x = new Expression("foo/*/bar1/=true");
            var result = x.Evaluate(lambda.First()).ToList();

            // Asserts.
            Assert.Single(result);
            Assert.Equal("bar1", result.First().Name);
        }

        [Fact]
        public void EqualIteratorSpacing_03()
        {
            // Creating some example lambda to run our expression on.
            var hl = "foo\n   bar1:hello world\n   bar1:yyy";
            var lambda = HyperlambdaParser.Parse(hl).Children;

            // Creating an expression, and evaluating it on above lambda.
            var x = new Expression("foo/*/bar1/=hello world");
            var result = x.Evaluate(lambda.First()).ToList();

            // Asserts.
            Assert.Single(result);
            Assert.Equal("bar1", result.First().Name);
        }

        [Fact]
        public void EmptySequence_01()
        {
            // Creating an expression, and evaluating it on above lambda.
            var x = new Expression("foo/1/@foo/*/..");

            // Evaluating our expression on an empty lambda object.
            var result = x.Evaluate(new Node()).ToList();

            // Asserts.
            Assert.Empty(result);
        }

        [Fact]
        public void CustomStaticIterator()
        {
            // Creating some example lambda to run our expression on.
            var hl = @"foo
   howdy:XXX";
            var lambda = HyperlambdaParser.Parse(hl).Children;

            // Creating an expression, and evaluating it on above lambda.
            Iterator.AddStaticIterator("^^", (identity, input) => {
                return input.Where(x => x.GetEx<string>() == "XXX");
            });
            var x = new Expression("../**/^^");
            var result = x.Evaluate(lambda.First()).ToList();
            Assert.Single(result);
            Assert.Equal("howdy", result.First().Name);
        }

        [Fact]
        public void CustomDynamicIterator()
        {
            // Creating some example lambda to run our expression on.
            var hl = @"foo
   howdy1:XXXXX
   howdy2:XXX
   howdy3:XXXXX
";
            var lambda = HyperlambdaParser.Parse(hl);

            // Creating an expression, and evaluating it on above lambda.
            Iterator.AddDynamicIterator('%', (iteratorValue) => {
                var no = int.Parse(iteratorValue.Substring(1));
                return (identity, input) => {
                    return input.Where(x => x.Get<string>()?.Length == no);
                };
            });
            var x = new Expression("../**/%3");
            var result = x.Evaluate(lambda);
            Assert.Single(result);
            Assert.Equal("howdy2", result.First().Name);
        }

        [Fact]
        public void ExtrapolatedExpression_01()
        {
            // Creating some example lambda to run our expression on.
            var hl = @"
.arg1:howdy2
.data
   howdy1:thomas
   howdy2:john
   howdy3:peter
";
            var lambda = HyperlambdaParser.Parse(hl);
            var x = new Expression("../*/.data/*/{../*/.arg1}");
            var result = x.Evaluate(lambda);
            Assert.Single(result);
            Assert.Equal("howdy2", result.First().Name);
            Assert.Equal("john", result.First().Value);
        }

        [Fact]
        public void ExtrapolatedExpression_02_THROWS()
        {
            Assert.Throws<HyperlambdaException>(() => new Expression("../*/.data/*/{../*/.arg1"));
        }

        [Fact]
        public void ExtrapolatedExpression_03()
        {
            // Creating some example lambda to run our expression on.
            var hl = @"
.arg1:howdy2
.arg2:.arg1
.data
   howdy1:thomas
   howdy2:john
   howdy3:peter
";
            var lambda = HyperlambdaParser.Parse(hl);
            var x = new Expression("../*/.data/*/{../*/{../*/.arg2}}");
            var result = x.Evaluate(lambda);
            Assert.Single(result);
            Assert.Equal("howdy2", result.First().Name);
            Assert.Equal("john", result.First().Value);
        }

        [Fact]
        public void ExtrapolatedExpression_04_THROWS()
        {
            // Creating some example lambda to run our expression on.
            var hl = @"
.arg1:howdy2
.arg2:.arg1
.arg2:.argXXX
.data
   howdy1:thomas
   howdy2:john
   howdy3:peter
";
            var lambda = HyperlambdaParser.Parse(hl);
            var x = new Expression("../*/.data/*/{../*/{../*/.arg2}}");
            Assert.Throws<HyperlambdaException>(() => x.Evaluate(lambda));
        }

        [Fact]
        public void ExtrapolatedExpression_05()
        {
            // Creating some example lambda to run our expression on.
            var hl = @"
.arg1:howdy2
.arg2:.arg1
.arg2:ERROR
.data
   howdy1:thomas
   howdy2:john
   howdy3:peter
";
            var lambda = HyperlambdaParser.Parse(hl);
            var x = new Expression("../*/.data/*/{../*/{../*/.arg2/[0,1]}}");
            var result = x.Evaluate(lambda);
            Assert.Single(result);
            Assert.Equal("howdy2", result.First().Name);
            Assert.Equal("john", result.First().Value);
        }

        [Fact]
        public void ExtrapolatedExpression_06()
        {
            // Creating some example lambda to run our expression on.
            var hl = @"
.arg1:.data
.arg2:howdy1
.data
   howdy1:thomas
   howdy2:john
   howdy3:peter
";
            var lambda = HyperlambdaParser.Parse(hl);
            var x = new Expression("../*/{../*/.arg1}/*/{../*/.arg2}");
            var result = x.Evaluate(lambda);
            Assert.Single(result);
            Assert.Equal("howdy1", result.First().Name);
            Assert.Equal("thomas", result.First().Value);
        }

        [Fact]
        public void ExtrapolatedExpression_07()
        {
            // Creating some example lambda to run our expression on.
            var hl = @"
.arg1:ERROR
.data
   howdy1:thomas
   howdy2:john
   howdy3:peter
";
            var lambda = HyperlambdaParser.Parse(hl);
            var x = new Expression("../*/{../*/.arg1}");
            var result = x.Evaluate(lambda);
            Assert.Empty(result);
        }

        [Fact]
        public void ExtrapolatedExpression_08()
        {
            // Creating some example lambda to run our expression on.
            var hl = @"
.arg1
.data
   howdy1:thomas
   howdy2:john
   howdy3:peter
";
            var lambda = HyperlambdaParser.Parse(hl);
            var x = new Expression("../*/{../*/.arg1}");
            var result = x.Evaluate(lambda);
            Assert.Empty(result);
        }

        [Fact]
        public void ExtrapolatedExpression_09()
        {
            // Creating some example lambda to run our expression on.
            var hl = @"
.arg1:.data
.data
   howdy1:thomas
   howdy2:john
   howdy3:peter
";
            var lambda = HyperlambdaParser.Parse(hl);
            var x = new Expression("../*/{../*/.arg1}/*/howdy1");
            var result = x.Evaluate(lambda);
            Assert.Single(result);
            Assert.Equal("howdy1", result.First().Name);
            Assert.Equal("thomas", result.First().Value);
        }

        [Fact]
        public void ExtrapolatedExpression_10()
        {
            // Creating some example lambda to run our expression on.
            var hl = @"
.arg1
.data
   howdy1:thomas
   howdy2:john
   howdy3:peter
";
            var lambda = HyperlambdaParser.Parse(hl);
            var x = new Expression("../*/{../*/.arg1}/*/howdy1");
            var result = x.Evaluate(lambda);
            Assert.Empty(result);
        }

        [Fact]
        public void ExtrapolatedExpression_11()
        {
            // Creating some example lambda to run our expression on.
            var hl = @"
.argERROR
.data
   howdy1:thomas
   howdy2:john
   howdy3:peter
";
            var lambda = HyperlambdaParser.Parse(hl);
            var x = new Expression("../*/{../*/.arg1}");
            var result = x.Evaluate(lambda);
            Assert.Empty(result);
        }

        [Fact]
        public void ExtrapolatedExpression_12()
        {
            // Creating some example lambda to run our expression on.
            var hl = @"
.arg1:.data
.arg2:howdy1
.data
   howdy1:thomas
   howdy2:john
   howdy3:peter
";
            var lambda = HyperlambdaParser.Parse(hl);
            var x = new Expression("../*/{../*/.arg1}/*/{../*/.arg2}");
            var result = x.Evaluate(lambda);
            Assert.Single(result);
            Assert.Equal("howdy1", result.First().Name);
            Assert.Equal("thomas", result.First().Value);
        }

        [Fact]
        public void ExtrapolatedExpression_13()
        {
            // Creating some example lambda to run our expression on.
            var hl = @"
.arg1:john
.data
   howdy1:thomas
   howdy2:john
   howdy3:peter
";
            var lambda = HyperlambdaParser.Parse(hl);
            var x = new Expression("../*/.data/*/={../*/.arg1}/./1");
            var result = x.Evaluate(lambda);
            Assert.Single(result);
            Assert.Equal("howdy2", result.First().Name);
            Assert.Equal("john", result.First().Value);
        }
    }
}
