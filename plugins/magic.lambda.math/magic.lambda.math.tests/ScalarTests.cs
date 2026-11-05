/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Linq;
using Xunit;
using magic.node.extensions;

namespace magic.lambda.math.tests
{
    public class ScalarTests
    {
        static readonly object[] Decimals = [2.5m, 2m, 1m, 2m];

        [Theory]
        [InlineData("math.abs:int:-5", 5)]
        [InlineData("math.abs:int:5", 5)]
        [InlineData("math.abs:long:-5", 5L)]
        [InlineData("math.abs:double:-2.5", 2.5)]
        [InlineData("math.ceil:double:1.2", 2.0)]
        [InlineData("math.ceil:double:-1.2", -1.0)]
        [InlineData("math.floor:double:1.8", 1.0)]
        [InlineData("math.floor:double:-1.2", -2.0)]
        [InlineData("math.round:double:1.4", 1.0)]
        [InlineData("math.round:double:1.6", 2.0)]
        [InlineData("math.round:double:2.5", 2.0)]
        [InlineData("math.sqrt:double:9", 3.0)]
        [InlineData("math.sqrt:int:16", 4.0)]
        [InlineData("math.sin:double:0", 0.0)]
        [InlineData("math.cos:double:0", 1.0)]
        public void Scalars(string hl, object expected)
        {
            var lambda = Common.Evaluate(hl);
            Assert.Equal(expected, lambda.Children.First().Value);
        }

        [Fact]
        public void DecimalsStayDecimal()
        {
            var lambda = Common.Evaluate("math.abs:decimal:-2.5\nmath.ceil:decimal:1.2\nmath.floor:decimal:1.8\nmath.round:decimal:1.6");
            Assert.Equal(Decimals, lambda.Children.Select(x => x.Value).ToArray());
        }

        [Fact]
        public void ScalarsAcceptExpressions()
        {
            var lambda = Common.Evaluate(".v:int:-7\nmath.abs:x:@.v");
            Assert.Equal(7, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void SinAndCosOfPiAreExact()
        {
            var lambda = Common.Evaluate("math.cos:double:3.141592653589793\nmath.sin:double:1.5707963267948966");
            Assert.Equal(-1.0, (double)lambda.Children.First().Value, 10);
            Assert.Equal(1.0, (double)lambda.Children.Skip(1).First().Value, 10);
        }

        [Fact]
        public void RandomWithoutArgumentsIsBetweenZeroAndOne()
        {
            for (var idx = 0; idx < 50; idx++)
            {
                var value = (double)Common.Evaluate("math.random").Children.First().Value;
                Assert.InRange(value, 0.0, 1.0);
            }
        }

        [Fact]
        public void RandomWithOneArgumentIsBelowMax()
        {
            for (var idx = 0; idx < 50; idx++)
            {
                var value = (int)Common.Evaluate("math.random\n   max:int:5").Children.First().Value;
                Assert.InRange(value, 0, 4);
            }
        }

        [Fact]
        public void RandomWithTwoArgumentsIsWithinBounds()
        {
            for (var idx = 0; idx < 50; idx++)
            {
                var value = (int)Common.Evaluate("math.random\n   min:int:10\n   max:int:13").Children.First().Value;
                Assert.InRange(value, 10, 12);
            }
        }
    }
}
