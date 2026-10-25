/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Text.RegularExpressions;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.strings.replace
{
    /// <summary>
    /// Shared helper for regex slots, bounding regular expression execution.
    /// </summary>
    internal static class RegexHelpers
    {
        /// <summary>
        /// Resolves the match timeout for a regular expression. The .NET Regex engine
        /// provides no CancellationToken support, so the remaining execution deadline is
        /// used as its match timeout instead - meaning [execution.timeout] effectively
        /// bounds regex execution the same way it bounds any other statement, throwing
        /// RegexMatchTimeoutException from within the engine when the budget is spent.
        /// When no execution deadline has been configured, the historical unbounded
        /// behaviour is preserved.
        /// </summary>
        internal static TimeSpan MatchTimeout(ISignaler signaler)
        {
            var context = signaler.Peek<ExecutionContext>("execution.context");
            if (context?.DeadlineUtc == null)
                return Regex.InfiniteMatchTimeout;

            var remaining = context.DeadlineUtc.Value - DateTime.UtcNow;
            return remaining <= TimeSpan.Zero ? TimeSpan.FromMilliseconds(1) : remaining;
        }

        /// <summary>
        /// Translates RegexMatchTimeoutException into a HyperlambdaException carrying a
        /// concise message, without echoing the pattern or source that caused the timeout.
        /// </summary>
        internal static HyperlambdaException OnTimeout()
        {
            return new HyperlambdaException("Regular expression timed out and was aborted");
        }
    }
}
