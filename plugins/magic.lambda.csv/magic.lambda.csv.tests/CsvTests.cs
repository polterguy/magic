/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using Xunit;
using magic.node;
using magic.node.extensions;

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
    }
}
