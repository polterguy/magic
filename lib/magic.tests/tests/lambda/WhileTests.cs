/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System.Linq;
using Xunit;

namespace magic.tests.tests.lambda
{
    public class WhileTests
	{
        [Fact]
        public void While_01()
        {
            var lambda = Common.Evaluate(@".src
   bar1
   bar2
.dest
while
   mt
      count:x:../*/.src/*
      .:int:0
   .lambda
      add:x:../*/.dest
         nodes:x:../*/.src/0
      set-node:x:../*/.src/0");
            Assert.Equal(2, lambda.Children.Skip(1).First().Children.Count());
        }
    }
}
