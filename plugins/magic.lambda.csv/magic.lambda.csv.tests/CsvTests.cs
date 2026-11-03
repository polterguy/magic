/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using Xunit;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.csv.tests
{
    public class CsvTests
    {
        [Fact]
        public void FromCsvSimpleObject()
        {
            var signaler = Common.GetSignaler();
            var node = new Node("", @"name, age
Thomas,55");
            signaler.Signal("csv2lambda", node);
            Assert.Equal("name", node.Children.First().Children.First().Name);
            Assert.Equal("Thomas", node.Children.First().Children.First().Value);
        }

        [Fact]
        public void Lambda2CsvSignatureRequiresExpressionInput()
        {
            var lambda = Common.Evaluate(@"slot.signature:lambda2csv");
            var result = lambda.Children.First();
            var input = result.Children.First(x => x.Name == "input");
            var children = result.Children.First(x => x.Name == "children");

            Assert.True(input.Children.First(x => x.Name == "required").GetEx<bool>());
            Assert.Equal(SlotValueMode.Expression.ToString(), input.Children.First(x => x.Name == "mode").GetEx<string>());
            Assert.Contains(children.Children, x => x.Name == "null-value");
            Assert.DoesNotContain(children.Children, x => x.Name == "*");
        }

        [Fact]
        public void FromEmptyString()
        {
            var signaler = Common.GetSignaler();
            var node = new Node("", @"");
            signaler.Signal("csv2lambda", node);
            Assert.Empty(node.Children);
        }

        [Fact]
        public void FromLambdaAndBackAgainWithTyping()
        {
            var result = Common.Evaluate(@"
.data
   .
      name:Thomas
      age:int:55
   .
      name:John
      age:67
lambda2csv:x:-/*
add:x:+/*/types
   get-nodes:x:@lambda2csv/*
csv2lambda:x:@lambda2csv
   types
");
            Assert.Equal("name", result.Children.Last().Children.First().Children.First().Name);
            Assert.Equal("Thomas", result.Children.Last().Children.First().Children.First().Value);
            Assert.Equal("age", result.Children.Last().Children.First().Children.Skip(1).First().Name);
            Assert.Equal(55, result.Children.Last().Children.First().Children.Skip(1).First().Value);
            Assert.Equal("name", result.Children.Last().Children.Skip(1).First().Children.First().Name);
            Assert.Equal("John", result.Children.Last().Children.Skip(1).First().Children.First().Value);
            Assert.Equal("age", result.Children.Last().Children.Skip(1).First().Children.Skip(1).First().Name);
            Assert.Equal(67, result.Children.Last().Children.Skip(1).First().Children.Skip(1).First().Value);
        }

        [Fact]
        public void FromLambdaAndBackAgainWithNullValues()
        {
            var result = Common.Evaluate(@"
.data
   .
      name
      age:int:55
   .
      name:John
      age
lambda2csv:x:-/*
add:x:+/*/types
   get-nodes:x:@lambda2csv/*
csv2lambda:x:@lambda2csv
   types
");
            Assert.Equal("name", result.Children.Last().Children.First().Children.First().Name);
            Assert.Null(result.Children.Last().Children.First().Children.First().Value);
            Assert.Equal("age", result.Children.Last().Children.First().Children.Skip(1).First().Name);
            Assert.Equal(55, result.Children.Last().Children.First().Children.Skip(1).First().Value);
            Assert.Equal("name", result.Children.Last().Children.Skip(1).First().Children.First().Name);
            Assert.Equal("John", result.Children.Last().Children.Skip(1).First().Children.First().Value);
            Assert.Equal("age", result.Children.Last().Children.Skip(1).First().Children.Skip(1).First().Name);
            Assert.Null(result.Children.Last().Children.Skip(1).First().Children.Skip(1).First().Value);
        }

        [Fact]
        public void FromLambdaAndBackAgainWithAlternativeNull()
        {
            var result = Common.Evaluate(@"
.data
   .
      name
      age:int:55
   .
      name:John
      age
lambda2csv:x:-/*
   null-value:foo
add:x:+/*/types
   get-nodes:x:@lambda2csv/*
csv2lambda:x:@lambda2csv
   null-value:foo
   types
");
            Assert.Equal("name", result.Children.Last().Children.First().Children.First().Name);
            Assert.Null(result.Children.Last().Children.First().Children.First().Value);
            Assert.Equal("age", result.Children.Last().Children.First().Children.Skip(1).First().Name);
            Assert.Equal(55, result.Children.Last().Children.First().Children.Skip(1).First().Value);
            Assert.Equal("name", result.Children.Last().Children.Skip(1).First().Children.First().Name);
            Assert.Equal("John", result.Children.Last().Children.Skip(1).First().Children.First().Value);
            Assert.Equal("age", result.Children.Last().Children.Skip(1).First().Children.Skip(1).First().Name);
            Assert.Null(result.Children.Last().Children.Skip(1).First().Children.Skip(1).First().Value);
            Assert.Contains("foo,", result.Children.Skip(1).First().GetEx<string>());
        }

        [Fact]
        public void FormulaInjectionNeutralisedByDefault()
        {
            var result = Common.Evaluate(@"
.data
   .
      name:Thomas
      note:=1+1
lambda2csv:x:-/*
");
            var csv = result.Children.First(x => x.Name == "lambda2csv").GetEx<string>();

            // Formula-leading cell must be prefixed with a single quote so spreadsheets treat it as text.
            Assert.Contains("\"'=1+1\"", csv);
        }

        [Fact]
        public void FormulaInjectionCanBeDisabled()
        {
            var result = Common.Evaluate(@"
.data
   .
      name:Thomas
      note:=1+1
lambda2csv:x:-/*
   escape-formulas:bool:false
");
            var csv = result.Children.First(x => x.Name == "lambda2csv").GetEx<string>();

            // With the opt-out the value is left intact (still CSV-quoted, but not neutralised).
            Assert.Contains("\"=1+1\"", csv);
            Assert.DoesNotContain("'=1+1", csv);
        }

        [Fact]
        public void HeaderWithSpecialCharsIsQuotedAndRoundTrips()
        {
            var result = Common.Evaluate(@"
.data
   .
      ""a,b"":Thomas
lambda2csv:x:-/*
csv2lambda:x:@lambda2csv
");
            var csv = result.Children.First(x => x.Name == "lambda2csv").GetEx<string>();

            // Header containing a comma must be quoted so it does not corrupt CSV structure.
            Assert.Contains("\"a,b\"", csv);

            // And it must survive a round-trip back through csv2lambda.
            var row = result.Children.Last().Children.First();
            Assert.Equal("a,b", row.Children.First().Name);
            Assert.Equal("Thomas", row.Children.First().Value);
        }
    }
}
