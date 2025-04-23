/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using Xunit;
using magic.node.extensions;

namespace magic.lambda.tests
{
    public class NullTests
    {
        [Fact]
        public void NullTrue()
        {
            var lambda = Common.Evaluate(@".dest
   foo
null:x:-/*");
            Assert.True(lambda.Children.Skip(1).First().GetEx<bool>());
        }

        [Fact]
        public void NullTrueNoExisting()
        {
            var lambda = Common.Evaluate(@".dest
null:x:-/*");
            Assert.True(lambda.Children.Skip(1).First().GetEx<bool>());
        }

        [Fact]
        public void NullFalse()
        {
            var lambda = Common.Evaluate(@".dest
   foo:foo
null:x:-/*");
            Assert.False(lambda.Children.Skip(1).First().GetEx<bool>());
        }

        [Fact]
        public void NotNullTrue()
        {
            var lambda = Common.Evaluate(@".dest
   foo:foo
not-null:x:-/*");
            Assert.True(lambda.Children.Skip(1).First().GetEx<bool>());
        }

        [Fact]
        public void NotNullFalse()
        {
            var lambda = Common.Evaluate(@".dest
   foo
not-null:x:-/*");
            Assert.False(lambda.Children.Skip(1).First().GetEx<bool>());
        }
    }
}
