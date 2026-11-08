/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Linq;
using System.Threading.Tasks;
using Xunit;
using magic.node.extensions;

namespace magic.lambda.strings.tests
{
    public class SubstringRangeTests
    {
        [Theory]
        [InlineData("strings.substring:hello\n   :int:-1")]
        [InlineData("strings.substring:hello\n   :int:6")]
        [InlineData("strings.substring:hello\n   :int:1\n   :int:-2")]
        public async Task OutOfRangeBoundsAreRejected(string hl)
        {
            await Assert.ThrowsAsync<HyperlambdaException>(() => Common.EvaluateAsync(hl));
        }

        [Fact]
        public async Task OffsetAtEndOfStringGivesEmptyString()
        {
            var lambda = await Common.EvaluateAsync("strings.substring:hello\n   :int:5");
            Assert.Equal("", lambda.Children.First().Value);
        }
    }
}
