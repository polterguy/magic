/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System.Linq;
using Xunit;

namespace magic.tests.lambda
{
    public class AddTests
    {
        [Fact]
        public void AddChildrenSrc()
        {
            var lambda = Common.Evaluate(".dest\nadd:x:../*/.dest\n   .\n      foo1:bar1\n      foo2:bar2");
            Assert.Equal(2, lambda.Children.First().Children.Count());
            Assert.Equal("foo1", lambda.Children.First().Children.First().Name);
            Assert.Equal("bar1", lambda.Children.First().Children.First().Value);
            Assert.Equal("foo2", lambda.Children.First().Children.Skip(1).First().Name);
            Assert.Equal("bar2", lambda.Children.First().Children.Skip(1).First().Value);
        }

        [Fact]
        public void AddExpressionSrc()
        {
            var lambda = Common.Evaluate(".dest\n.src\n   foo1:bar1\n   foo2:bar2\nadd:x:../*/.dest\n   get-nodes:x:../*/.src/*");
            Assert.Equal(2, lambda.Children.First().Children.Count());
            Assert.Equal("foo1", lambda.Children.First().Children.First().Name);
            Assert.Equal("bar1", lambda.Children.First().Children.First().Value);
            Assert.Equal("foo2", lambda.Children.First().Children.Skip(1).First().Name);
            Assert.Equal("bar2", lambda.Children.First().Children.Skip(1).First().Value);
        }
    }
}
