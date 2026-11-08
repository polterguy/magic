/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Threading.Tasks;
using Xunit;
using magic.node.extensions;

namespace magic.lambda.threading.tests
{
    public class SleepTests
    {
        [Theory]
        [InlineData("sleep:int:-1")]
        [InlineData("sleep:int:-500")]
        public async Task NegativeDelayIsRejected(string hl)
        {
            await Assert.ThrowsAsync<HyperlambdaException>(() => Common.EvaluateAsync(hl));
        }

        [Fact]
        public async Task ZeroDelayIsAccepted()
        {
            await Common.EvaluateAsync("sleep:int:0");
        }
    }
}
