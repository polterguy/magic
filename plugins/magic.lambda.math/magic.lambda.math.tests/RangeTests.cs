/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Linq;
using System.Threading.Tasks;
using Xunit;
using magic.node.extensions;

namespace magic.lambda.math.tests
{
    public class RangeTests
    {
        [Theory]
        [InlineData("math.random\n   :int:-1")]
        [InlineData("math.random\n   min:int:5\n   max:int:4")]
        public void InvalidRandomBoundsAreRejected(string hl)
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(hl));
        }

        [Theory]
        [InlineData("math.random\n   :int:0", 0)]
        [InlineData("math.random\n   min:int:7\n   max:int:7", 7)]
        public void DegenerateRandomBoundsAreAccepted(string hl, int expected)
        {
            Assert.Equal(expected, Common.Evaluate(hl).Children.First().Value);
        }

        [Theory]
        [InlineData("math.divide\n   :int:5\n   :int:0")]
        [InlineData("math.modulo\n   :int:5\n   :int:0")]
        [InlineData("math.divide\n   :decimal:5\n   :decimal:0")]
        public async Task IntegerAndDecimalZeroDivisionIsRejected(string hl)
        {
            await Assert.ThrowsAsync<HyperlambdaException>(() => Common.EvaluateAsync(hl));
        }
    }
}
