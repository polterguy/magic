/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Threading.Tasks;
using Xunit;
using magic.node.extensions;

namespace magic.lambda.tests
{
    public class MapTests
    {
        [Fact]
        public void Map_01()
        {
            var lambda = Common.Evaluate(@"
.src
   .:int:1
   .:int:2
   .:int:3
map:x:@.src/*
   math.increment:x:@.dp/#
   unwrap:x:+/*
   yield
      .:x:@math.increment");

            var map = lambda.Children.First(x => x.Name == "map");
            Assert.Equal(3, map.Children.Count());
            Assert.Equal(2, map.Children.First().GetEx<int>());
            Assert.Equal(3, map.Children.Skip(1).First().GetEx<int>());
            Assert.Equal(4, map.Children.Skip(2).First().GetEx<int>());
        }

        [Fact]
        public async Task MapAsync_01()
        {
            var lambda = await Common.EvaluateAsync(@"
.src
   .:int:1
   .:int:2
   .:int:3
map:x:@.src/*
   math.increment:x:@.dp/#
   return:x:-");

            var map = lambda.Children.First(x => x.Name == "map");
            Assert.Equal(3, map.Children.Count());
        }

        [Fact]
        public void Map_ThrowsWithoutReturn()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
.src
   .:int:1
map:x:@.src/*
   mt
      get-value:x:@.dp/#
      .:int:0"));
        }
    }
}
