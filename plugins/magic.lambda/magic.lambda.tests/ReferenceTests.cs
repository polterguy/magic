/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using Xunit;
using magic.node;
using magic.node.extensions;

namespace magic.lambda.tests
{
    public class ReferenceTests
    {
        [Fact]
        public void ReferenceCheck()
        {
            var lambda = Common.Evaluate(@".foo
   bar
reference:x:-");
            Assert.True(lambda.Children.Skip(1).First().Value is Node);
            Assert.Equal(".foo", lambda.Children.Skip(1).First().GetEx<Node>().Name);
            Assert.Equal("bar", lambda.Children.Skip(1).First().GetEx<Node>().Children.First().Name);
        }

        [Fact]
        public void ReferenceThrows_01()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@".foo
   bar
reference"));
        }

        [Fact]
        public void ReferenceThrows_02()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@".foo
   bar1
   bar2
reference:x:-/*"));
        }
    }
}
