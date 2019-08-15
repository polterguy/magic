/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System.Linq;
using Xunit;

namespace magic.tests.lambda
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
    }
}
