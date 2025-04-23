/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using magic.node.extensions;
using Xunit;

namespace magic.lambda.tests
{
    public class GetFirstValueTests
    {
        [Fact]
        public void SingleExpression_01()
        {
            var lambda = Common.Evaluate(@"
.src:foo1
get-first-value:x:../*/.src
");
            Assert.Equal("foo1", lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void SingleExpression_02()
        {
            var lambda = Common.Evaluate(@"
.data
   foo1
   foo2:bar2
   foo3:bar3
get-first-value:x:@.data/*
");
            Assert.Equal("bar2", lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void MultipleChildren_01()
        {
            var lambda = Common.Evaluate(@"
.data
   foo1:bar1
   foo2:bar2
   foo3:bar3
get-first-value
   get-value:x:@.data/1
   get-value:x:@.data/0
   get-value:x:@.data/2
");
            Assert.Equal("bar2", lambda.Children.Skip(1).First().Value);
            Assert.Empty(lambda.Children.Skip(1).First().Children);
        }

        [Fact]
        public void MultipleChildren_02()
        {
            var lambda = Common.Evaluate(@"
.data
   foo1:error
   foo2:error
get-first-value
   .:success
   get-value:x:@.data/0
   get-value:x:@.data/1
");
            Assert.Equal("success", lambda.Children.Skip(1).First().Value);
            Assert.Empty(lambda.Children.Skip(1).First().Children);
        }

        [Fact]
        public void Static_01()
        {
            var lambda = Common.Evaluate(@"
get-first-value:success
");
            Assert.Equal("success", lambda.Children.First().Value);
        }
    }
}
