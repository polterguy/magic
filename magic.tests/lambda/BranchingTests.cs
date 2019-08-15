/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System.Linq;
using Xunit;

namespace magic.tests.lambda
{
    public class BranchingTests
    {
        [Fact]
        public void If_01()
        {
            var lambda = Common.Evaluate(".result\nif\n   .:bool:true\n   .lambda\n      set-value:x:../*/.result\n         .:OK");
            Assert.Equal("OK", lambda.Children.First().Value);
        }

        [Fact]
        public void If_02()
        {
            var lambda = Common.Evaluate(".result\nif\n   and\n      .:bool:true\n      .:bool:true\n   .lambda\n      set-value:x:../*/.result\n         .:OK");
            Assert.Equal("OK", lambda.Children.First().Value);
        }

        [Fact]
        public void If_03()
        {
            var lambda = Common.Evaluate(".result\nif\n   and\n      .:bool:true\n      .:bool:false\n   .lambda\n      set-value:x:../*/.result\n         .:FAILURE");
            Assert.Null(lambda.Children.First().Value);
        }

        [Fact]
        public void Else_01()
        {
            var lambda = Common.Evaluate(@"
.result
if
   .:bool:false
   .lambda
      set-value:x:../*/.result
         .:failure
else
   set-value:x:../*/.result
      .:OK");
            Assert.Equal("OK", lambda.Children.First().Value);
        }

        [Fact]
        public void ElseIf_01()
        {
            var lambda = Common.Evaluate(@"
.result
if
   .:bool:false
   .lambda
      set-value:x:../*/.result
         .:failure
else-if
   eq
      get-name:x:../*/.result
      .:.result
   .lambda
      set-value:x:../*/.result
         .:OK");
            Assert.Equal("OK", lambda.Children.First().Value);
        }
    }
}
