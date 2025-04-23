/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Threading.Tasks;
using Xunit;
using magic.node.extensions;

namespace magic.lambda.tests
{
    public class LogicalTests
    {
        [Fact]
        public void And_01()
        {
            var lambda = Common.Evaluate(@"
.foo1:bool:true
and
   get-value:x:../*/.foo1
   .:bool:true");
            Assert.Equal(true, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void And_02()
        {
            var lambda = Common.Evaluate(@"
.foo1:bool:true
and
   get-value:x:../*/.foo1
   .:bool:true
   .:bool:false");
            Assert.Equal(false, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void AndWhitelist()
        {
            var lambda = Common.Evaluate(@"
whitelist
   vocabulary
      get-value
      and
      return
   .lambda
      .foo1:bool:true
      and
         get-value:x:../*/.foo1
         .:bool:true
      return:x:-");
            Assert.True(lambda.Children.First().Get<bool>());
        }

        [Fact]
        public void AndWhitelist_Throws()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
whitelist
   vocabulary
      and
   .lambda
      .foo1:bool:true
      and
         get-value:x:../*/.foo1
         .:bool:true"));
        }

        [Fact]
        public void OrWhitelist()
        {
            var lambda = Common.Evaluate(@"
whitelist
   vocabulary
      get-value
      or
      return
   .lambda
      .foo1:bool:false
      or
         get-value:x:../*/.foo1
         .:bool:true
      return:x:-");
            Assert.True(lambda.Children.First().Get<bool>());
        }

        [Fact]
        public async Task OrWhitelistAsync_Throws()
        {
            await Assert.ThrowsAsync<HyperlambdaException>(async () => await Common.EvaluateAsync(@"
whitelist
   vocabulary
      or
   .lambda
      .foo1:bool:true
      or
         get-value:x:../*/.foo1
         .:bool:true"));
        }

        [Fact]
        public void OrWhitelist_Throws()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
.foo1:bool:true
whitelist
   vocabulary
      set-value
      or
   .lambda
      or
         get-value:x:../*/.foo1
         .:bool:true"));
        }

        [Fact]
        public async Task AndWhitelistAsync_Throws()
        {
            await Assert.ThrowsAsync<HyperlambdaException>(async () => await Common.EvaluateAsync(@"
.foo1:bool:true
whitelist
   vocabulary
      set-value
      and
   .lambda
      and
         get-value:x:../*/.foo1
         .:bool:true"));
        }

        [Fact]
        public void Or_01()
        {
            var lambda = Common.Evaluate(@"
.foo1:bool:true
or
   get-value:x:../*/.foo1
   .:bool:false");
            Assert.Equal(true, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Or_02()
        {
            var lambda = Common.Evaluate(@"
.foo1:bool:false
or
   get-value:x:../*/.foo1
   .:bool:true
   .:bool:false");
            Assert.Equal(true, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Or_03()
        {
            var lambda = Common.Evaluate(@"
.foo1:bool:false
or
   get-value:x:../*/.foo1
   .:bool:false
   .:bool:false");
            Assert.Equal(false, lambda.Children.Skip(1).First().Value);
        }
    }
}
