/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Xunit;
using Microsoft.Extensions.DependencyInjection;
using magic.signals.contracts;
using magic.node.extensions;
using magic.node.extensions.hyperlambda;

namespace magic.lambda.strings.tests
{
    public class RegexTimeoutTests
    {
        [Fact]
        public async Task Matches_Timeout_01()
        {
            var exception = await Assert.ThrowsAsync<HyperlambdaException>(async () =>
                await EvaluateWithDeadline(@"
.pat:(a+)+$
.foo:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaab
strings.matches:x:-
   get-value:x:@.pat
", TimeSpan.FromMilliseconds(50)));

            Assert.Contains("timed out", exception.Message);
        }

        [Fact]
        public async Task Replace_Timeout_01()
        {
            var exception = await Assert.ThrowsAsync<HyperlambdaException>(async () =>
                await EvaluateWithDeadline(@"
.pat:(a+)+$
.foo:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaab
strings.regex-replace:x:-
   get-value:x:@.pat
   .:x
", TimeSpan.FromMilliseconds(50)));

            Assert.Contains("timed out", exception.Message);
        }

        [Fact]
        public async Task Matches_WithinDeadline_01()
        {
            var lambda = await EvaluateWithDeadline(@"
.pat:han[0-9]*sen
.foo:thomas han0123sen
strings.matches:x:-
   get-value:x:@.pat
", TimeSpan.FromSeconds(5));

            var result = lambda.Children.Skip(2).First();
            Assert.Single(result.Children);
            Assert.Equal("han0123sen", result.Children.First().Value);
        }

        [Fact]
        public async Task Replace_WithinDeadline_01()
        {
            var lambda = await EvaluateWithDeadline(@"
.pat:han[0-9]*sen
.foo:thomas han0123sen
strings.regex-replace:x:-
   get-value:x:@.pat
   .:cool hansen
", TimeSpan.FromSeconds(5));

            Assert.Equal("thomas cool hansen", lambda.Children.Skip(2).First().Value);
        }

        #region [ -- Private helper methods -- ]

        static async Task<magic.node.Node> EvaluateWithDeadline(string hl, TimeSpan deadline)
        {
            var services = Common.Initialize();
            var signaler = services.GetService(typeof(ISignaler)) as ISignaler;
            var lambda = HyperlambdaParser.Parse(hl);
            var context = new magic.signals.contracts.ExecutionContext("regex-timeout-test", new CancellationTokenSource());
            context.TrySetTimeout(deadline);

            await signaler.ScopeAsync("execution.context", context, async () =>
            {
                await signaler.SignalAsync("eval", lambda);
            });
            return lambda;
        }

        #endregion
    }
}
