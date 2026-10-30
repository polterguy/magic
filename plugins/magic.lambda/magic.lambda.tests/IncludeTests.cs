/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using Xunit;
using magic.node.extensions;

namespace magic.lambda.tests
{
    public class IncludeTests
    {
        [Fact]
        public void Include_AddsReturnedNodes_ToEachDestination()
        {
            var lambda = Common.Evaluate(@"
.dest
   a
   b
include:x:../*/.dest/*
   return-nodes
      .
         foo:bar");
            var dest = lambda.Children.First();
            Assert.Equal(2, dest.Children.Count());
            Assert.Single(dest.Children.First().Children);
            Assert.Equal("bar", dest.Children.First().Children.First().Children.First().Value);
            Assert.Single(dest.Children.Skip(1).First().Children);
        }

        [Fact]
        public void Include_ExposesDestination_AsDp()
        {
            var lambda = Common.Evaluate(@"
.dest
   a:1
   b:2
include:x:../*/.dest/*
   return-nodes:x:@.dp");
            var dest = lambda.Children.First();
            var copy = dest.Children.First().Children.First();
            Assert.Equal(".dp", copy.Name);
            var seen = Assert.IsType<magic.node.Node>(copy.Value);
            Assert.Equal("a", seen.Name);
        }

        [Fact]
        public void Include_ClearsItsOwnChildren_AfterwardsAndWithNoDestinations()
        {
            var lambda = Common.Evaluate(@"
include:x:../*/.nothing
   return-nodes
      .
         foo:bar");
            Assert.Empty(lambda.Children.First().Children);
        }

        [Fact]
        public void Include_WithNoReturnedNodes_LeavesDestinationUntouched()
        {
            var lambda = Common.Evaluate(@"
.dest
   a
include:x:../*/.dest/*
   .foo:bar");
            Assert.Empty(lambda.Children.First().Children.First().Children);
        }
    }
}
