/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Linq;
using Xunit;

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
    }
}
