/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using magic.node.extensions;
using Xunit;

namespace magic.lambda.tests
{
    public class GetTests
    {
        [Fact]
        public void Value()
        {
            var lambda = Common.Evaluate(@"
.src:foo1
get-value:x:../*/.src
");
            Assert.Equal("foo1", lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void ValueReturnsNull()
        {
            var lambda = Common.Evaluate(@"
.src:foo1
get-value:x:../*/.srcXXX
");
            Assert.Null(lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Name()
        {
            var lambda = Common.Evaluate(@"
.foo1
get-name:x:../*/.foo1
");
            Assert.Equal(".foo1", lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void NameThrows()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
.foo1
.foo1
get-name:x:../*/.foo1
"));
        }

        [Fact]
        public void NameNull()
        {
            var lambda = Common.Evaluate(@"
.foo1
get-name:x:../*/.fooXX
");
            Assert.Null(lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void NameThrows_01()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
.foo1
  bar1
  bar2
get-name:x:../*/.foo1/*
"));
        }

        [Fact]
        public void Count()
        {
            var lambda = Common.Evaluate(@"
.foo1
   bar1
   bar2
get-count:x:../*/.foo1/*
");
            Assert.Equal(2, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void CountThrows()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"

get-count
"));
        }
    }
}
