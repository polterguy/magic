/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System.Linq;
using Xunit;

namespace magic.tests.lambda
{
    public class ConvertTests
    {
        [Fact]
        public void ConvertToInt()
        {
            var lambda = Common.Evaluate(@"
.src:5
convert:x:-
   type:int");
            Assert.Equal(5, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void ConvertToString()
        {
            var lambda = Common.Evaluate(@"
.src:int:5
convert:x:-
   type:string");
            Assert.Equal("5", lambda.Children.Skip(1).First().Value);
        }
    }
}
