/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Linq;
using Xunit;
using magic.node.extensions;

namespace magic.lambda.tests
{
    public class ComposeTests
    {
        [Fact]
        public void ComposeJoinsChildrenIntoAnExpression()
        {
            var lambda = Common.Evaluate(".foo\n   bar:42\ncompose\n   .:@.foo\n   .:bar");
            var compose = lambda.Children.Skip(1).First();
            var expression = Assert.IsType<Expression>(compose.Value);
            Assert.Equal("@.foo/bar", expression.Value);
            Assert.Empty(compose.Children);
        }

        [Fact]
        public void ComposeEvaluatesItsChildrenFirst()
        {
            var lambda = Common.Evaluate(".part:bar\ncompose\n   .:@.foo\n   .:x:@.part");
            var compose = lambda.Children.Skip(1).First();
            Assert.Equal("@.foo/bar", Assert.IsType<Expression>(compose.Value).Value);
        }
    }
}
