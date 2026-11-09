/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Linq;
using Xunit;
using magic.node.extensions;

namespace magic.lambda.crypto.tests
{
    public class RandomIntegerTests
    {
        [Fact]
        public void WithoutArgumentsIsNonNegative()
        {
            var lambda = Common.Evaluate("crypto.random.int");
            var value = (int)lambda.Children.First().Value;
            Assert.InRange(value, 0, int.MaxValue - 1);
            Assert.Empty(lambda.Children.First().Children);
        }

        [Fact]
        public void MaxIsAnExclusiveUpperBound()
        {
            for (var idx = 0; idx < 50; idx++)
            {
                var value = (int)Common.Evaluate("crypto.random.int\n   max:int:7").Children.First().Value;
                Assert.InRange(value, 0, 6);
            }
        }

        [Fact]
        public void SeedIsAccepted()
        {
            var value = (int)Common.Evaluate("crypto.random.int\n   seed:foo bar\n   max:int:100").Children.First().Value;
            Assert.InRange(value, 0, 99);
        }

        [Fact]
        public void MaxOfZero_Throws()
        {
            // Previously 'result % 0' threw a raw DivideByZeroException (HTTP 500); now a clean Hyperlambda error.
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate("crypto.random.int\n   max:int:0"));
        }

        [Fact]
        public void NegativeMax_Throws()
        {
            // A negative upper bound cannot produce a value "less than max", so it must be rejected rather than silently return a non-negative number.
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate("crypto.random.int\n   max:int:-10"));
        }

        [Fact]
        public void SeededManyTimes_NeverThrows()
        {
            // Exercises the sign handling that used to throw OverflowException when the random bytes decoded to int.MinValue.
            for (var idx = 0; idx < 500; idx++)
            {
                var value = (int)Common.Evaluate($"crypto.random.int\n   seed:seed-{idx}\n   max:int:1000").Children.First().Value;
                Assert.InRange(value, 0, 999);
            }
        }
    }
}
