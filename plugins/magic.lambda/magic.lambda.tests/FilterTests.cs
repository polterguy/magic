/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Linq;
using System.Threading.Tasks;
using Xunit;
using magic.node.extensions;

namespace magic.lambda.tests
{
    public class FilterTests
    {
        [Fact]
        public void Filter_01()
        {
            var lambda = Common.Evaluate(@"
.src
   .:int:1
   .:int:2
   .:int:3
filter:x:@.src/*
   mt
      get-value:x:@.dp/#
      .:int:1
   return:x:-");

            var filter = lambda.Children.First(x => x.Name == "filter");
            Assert.Equal(2, filter.Children.Count());
            Assert.Equal(2, filter.Children.First().GetEx<int>());
            Assert.Equal(3, filter.Children.Skip(1).First().GetEx<int>());
        }

        [Fact]
        public async Task FilterAsync_01()
        {
            var lambda = await Common.EvaluateAsync(@"
.src
   .:int:1
   .:int:2
   .:int:3
filter:x:@.src/*
   mt
      get-value:x:@.dp/#
      .:int:1
   return:x:-");

            var filter = lambda.Children.First(x => x.Name == "filter");
            Assert.Equal(2, filter.Children.Count());
        }

        [Fact]
        public void Filter_ReturnTrue()
        {
            var lambda = Common.Evaluate(@"
.src
   .:int:1
   .:int:2
filter:x:@.src/*
   return:bool:true");

            var filter = lambda.Children.First(x => x.Name == "filter");
            Assert.Equal(2, filter.Children.Count());
        }

        [Fact]
        public void Filter_ReturnFalse()
        {
            var lambda = Common.Evaluate(@"
.src
   .:int:1
   .:int:2
filter:x:@.src/*
   return:bool:false");

            var filter = lambda.Children.First(x => x.Name == "filter");
            Assert.Empty(filter.Children);
        }
    }
}
