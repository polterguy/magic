/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Threading.Tasks;
using Xunit;
using magic.node.extensions;

namespace magic.lambda.math.tests
{
    public class DotTests
    {
        [Theory]
        [InlineData("math.dot\n   .:int:1")]
        [InlineData("math.dot\n   .\n      .:int:1\n   .\n      .:int:2\n   .\n      .:int:3")]
        public async Task DotRequiresExactlyTwoVectors(string hl)
        {
            await Assert.ThrowsAsync<HyperlambdaException>(() => Common.EvaluateAsync(hl));
        }
    }
}
