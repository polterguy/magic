/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System.Linq;
using Xunit;

namespace magic.tests.tests.lambda
{
    public class MathTests
    {
        [Fact]
        public void Add()
        {
            var lambda = Common.Evaluate(@"

+
   :int:5
   :int:7");
            Assert.Equal(12, lambda.Children.First().Value);
        }

        [Fact]
        public void AddExpression()
        {
            var lambda = Common.Evaluate(@"

+
   :x:./+
   :int:7
.:int:5");
            Assert.Equal(12, lambda.Children.First().Value);
        }

        [Fact]
        public void Subtract()
        {
            var lambda = Common.Evaluate(@"

-
   :int:8
   :int:5
   :int:1");
            Assert.Equal(2, lambda.Children.First().Value);
        }

        [Fact]
        public void Multiply()
        {
            var lambda = Common.Evaluate(@"

*
   :int:2
   :int:2
   :int:3");
            Assert.Equal(12, lambda.Children.First().Value);
        }

        [Fact]
        public void Divide()
        {
            var lambda = Common.Evaluate(@"

/
   :int:12
   :int:2");
            Assert.Equal(6, lambda.Children.First().Value);
        }
    }
}
