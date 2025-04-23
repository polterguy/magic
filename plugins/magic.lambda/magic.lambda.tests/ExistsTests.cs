/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using Xunit;
using magic.node.extensions;

namespace magic.lambda.tests
{
    public class ExistsTests
    {
        [Fact]
        public void ExistsTrue()
        {
            var lambda = Common.Evaluate(@".dest
   foo
exists:x:-/*");
            Assert.True(lambda.Children.Skip(1).First().GetEx<bool>());
        }

        [Fact]
        public void ExistsFalse()
        {
            var lambda = Common.Evaluate(@".dest
exists:x:-/*");
            Assert.False(lambda.Children.Skip(1).First().GetEx<bool>());
        }

        [Fact]
        public void NotExistsTrue()
        {
            var lambda = Common.Evaluate(@".dest
   foo
not-exists:x:-/*");
            Assert.False(lambda.Children.Skip(1).First().GetEx<bool>());
        }

        [Fact]
        public void NotExistsFalse()
        {
            var lambda = Common.Evaluate(@".dest
not-exists:x:-/*");
            Assert.True(lambda.Children.Skip(1).First().GetEx<bool>());
        }
    }
}
