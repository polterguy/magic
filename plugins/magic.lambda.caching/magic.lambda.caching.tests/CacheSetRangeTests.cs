/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Threading.Tasks;
using Xunit;
using magic.node.extensions;

namespace magic.lambda.caching.tests
{
    public class CacheSetRangeTests
    {
        [Theory]
        [InlineData("-5")]
        [InlineData("0")]
        [InlineData("9223372036854775807")]
        public async Task OutOfRangeExpirationIsRejected(string expiration)
        {
            await Assert.ThrowsAsync<HyperlambdaException>(() => Common.EvaluateAsync($"cache.set:foo\n   expiration:long:{expiration}\n   value:bar"));
        }
    }
}
