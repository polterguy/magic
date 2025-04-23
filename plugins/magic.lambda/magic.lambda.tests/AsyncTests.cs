/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace magic.lambda.tests
{
    public class AsyncTests
    {
        [Fact]
        public async Task AddChildrenSrcAsync()
        {
            var lambda = await Common.EvaluateAsync(@"
.dest
add:x:../*/.dest
   .
      foo1:bar1
      foo2:bar2
add:x:../*/.dest
   .
      foo1:bar1
      foo2:bar2");
            Assert.Equal(4, lambda.Children.First().Children.Count());
            Assert.Equal("foo1", lambda.Children.First().Children.First().Name);
            Assert.Equal("bar1", lambda.Children.First().Children.First().Value);
            Assert.Equal("foo2", lambda.Children.First().Children.Skip(1).First().Name);
            Assert.Equal("bar2", lambda.Children.First().Children.Skip(1).First().Value);
            Assert.Equal("foo1", lambda.Children.First().Children.Skip(2).First().Name);
            Assert.Equal("bar1", lambda.Children.First().Children.Skip(2).First().Value);
            Assert.Equal("foo2", lambda.Children.First().Children.Skip(3).First().Name);
            Assert.Equal("bar2", lambda.Children.First().Children.Skip(3).First().Value);
        }

        [Fact]
        public async Task SetSyncInAsyncContext()
        {
            var lambda = await Common.EvaluateAsync(@"
.dest
set-value:x:-
   .:OK");
            Assert.Equal("OK", lambda.Children.First().Value);
        }
    }
}
