/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using Xunit;

namespace magic.lambda.tests
{
    public class AddTests
    {
        [Fact]
        public void AddChildrenSrc()
        {
            var lambda = Common.Evaluate(@"
.dest
add:x:../*/.dest
   .
      foo1:bar1
      foo2:bar2");
            Assert.Equal(2, lambda.Children.First().Children.Count());
            Assert.Equal("foo1", lambda.Children.First().Children.First().Name);
            Assert.Equal("bar1", lambda.Children.First().Children.First().Value);
            Assert.Equal("foo2", lambda.Children.First().Children.Skip(1).First().Name);
            Assert.Equal("bar2", lambda.Children.First().Children.Skip(1).First().Value);
        }

        [Fact]
        public void AddExpressionSrc()
        {
            var lambda = Common.Evaluate(@"
.dest
.src
   foo1:bar1
   foo2:bar2
add:x:../*/.dest
   get-nodes:x:../*/.src/*");
            Assert.Equal(2, lambda.Children.First().Children.Count());
            Assert.Equal("foo1", lambda.Children.First().Children.First().Name);
            Assert.Equal("bar1", lambda.Children.First().Children.First().Value);
            Assert.Equal("foo2", lambda.Children.First().Children.Skip(1).First().Name);
            Assert.Equal("bar2", lambda.Children.First().Children.Skip(1).First().Value);
        }

        [Fact]
        public void AddExpressionSrcEmptyValue()
        {
            var lambda = Common.Evaluate(@"
.dest
add:x:../*/.dest
   get-nodes");
            Assert.Empty(lambda.Children.First().Children);
        }
    }
}
