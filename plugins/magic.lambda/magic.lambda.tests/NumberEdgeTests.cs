/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Linq;
using Xunit;
using magic.node.extensions;

namespace magic.lambda.tests
{
    public class NumberEdgeTests
    {
        [Theory]
        [InlineData("lt", "decimal:1", "double:1E+30", true)]
        [InlineData("mt", "decimal:1", "double:1E+30", false)]
        [InlineData("eq", "decimal:1", "double:1E+30", false)]
        [InlineData("lt", "decimal:1", "float:Infinity", true)]
        [InlineData("eq", "decimal:1", "float:NaN", false)]
        [InlineData("mt", "ulong:18446744073709551615", "long:-1", true)]
        [InlineData("eq", "ulong:18446744073709551615", "long:-1", false)]
        [InlineData("eq", "uint:7", "ushort:7", true)]
        [InlineData("lt", "sbyte:-1", "byte:1", true)]
        [InlineData("mte", "short:3", "uint:3", true)]
        [InlineData("eq", "float:1.5", "decimal:1.5", true)]
        public void MixedNumericTypes(string op, string lhs, string rhs, bool expected)
        {
            var lambda = Common.Evaluate(op + "\n   .:" + lhs + "\n   .:" + rhs);
            Assert.Equal(expected, lambda.Children.First().Value);
        }

        [Fact]
        public void Base64OfUnsupportedValueThrows()
        {
            var ex = Assert.Throws<HyperlambdaException>(() => Common.Evaluate(".src:int:5\nconvert:x:-\n   type:base64"));
            Assert.Contains("base64 encode", ex.Message);
        }

        [Fact]
        public void FromBase64OfNonStringThrows()
        {
            var ex = Assert.Throws<HyperlambdaException>(() => Common.Evaluate(".src:int:5\nconvert:x:-\n   type:from-base64"));
            Assert.Contains("base64 decode", ex.Message);
        }
    }
}
