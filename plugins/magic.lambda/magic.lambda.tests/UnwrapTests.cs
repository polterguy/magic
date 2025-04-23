/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using Xunit;
using magic.node.extensions;

namespace magic.lambda.tests
{
    public class UnwrapTests
    {
        [Fact]
        public void UnwrapValue()
        {
            var lambda = Common.Evaluate(@".src
   foo1:bar1
   foo2:bar2
.dest
   dest1:x:../*/.src/0
   dest2:x:../*/.src/1
unwrap:x:../*/.dest/*");
            Assert.Equal("dest1", lambda.Children.Skip(1).First().Children.First().Name);
            Assert.Equal("bar1", lambda.Children.Skip(1).First().Children.First().Value);
            Assert.Equal("dest2", lambda.Children.Skip(1).First().Children.Skip(1).First().Name);
            Assert.Equal("bar2", lambda.Children.Skip(1).First().Children.Skip(1).First().Value);
        }

        [Fact]
        public void UnwrapToNull()
        {
            var lambda = Common.Evaluate(@"
.dest
   dest1:x:../*/.src/0
   dest2:x:../*/.src/1
unwrap:x:../*/.dest/*");
            Assert.Null(lambda.Children.First().Children.First().Value);
            Assert.Null(lambda.Children.First().Children.Skip(1).First().Value);
        }

        [Fact]
        public void UnwrapValue_Throws()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@".src
   foo1:bar1
   foo2:bar2
.dest
   dest1:x:../*/.src/*
   dest2:x:../*/.src/*
unwrap:x:../*/.dest/*"));
        }
    }
}
