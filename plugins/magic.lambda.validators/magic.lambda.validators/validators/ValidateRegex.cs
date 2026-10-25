/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Text.RegularExpressions;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.lambda.validators.helpers;

namespace magic.lambda.validators.validators
{
    /// <summary>
    /// [validators.regex] slot, for verifying that some input is matching some specified regular expression found in [regex].
    /// </summary>
    [Slot(
        Name = "validators.regex",
        Description = "Validates that a value or resolved expression result matches a regular expression, bounded by the execution deadline when set, throwing if validation fails",
        ValueKind = "text",
        ValueDescription = "Value or expression selecting the node or nodes to validate",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.None,
        SignatureType = typeof(global::magic.lambda.validators.signatures.RegexValidatorSignature))]
    public class ValidateRegex : ISlot
    {
        /// <summary>
        /// Implementation of slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise the signal.</param>
        /// <param name="input">Arguments to signal.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var pattern = input.Children.First(x => x.Name == "regex").GetEx<string>();

            /*
             * The .NET Regex engine provides no CancellationToken support, so the remaining
             * execution deadline is used as the match timeout instead - meaning [execution.timeout]
             * bounds the match the same way it bounds any other statement, preventing catastrophic
             * backtracking from holding a thread hostage past the deadline.
             */
            var ex = new Regex(pattern, RegexOptions.None, MatchTimeout(signaler));
            Enumerator.Enumerate<string>(input, (value, name) =>
            {
                bool isMatch;
                try
                {
                    isMatch = ex.IsMatch(value);
                }
                catch (RegexMatchTimeoutException)
                {
                    throw new HyperlambdaException(
                        $"Regular expression timed out and was aborted for [{name}]",
                        true,
                        400,
                        name);
                }

                if (!isMatch)
                {
                    /*
                     * Never echoing the whole value or pattern - the message is returned to the
                     * caller, logged, and captured by exception handlers, and either can be huge.
                     */
                    var shownValue = value.Length > 50 ? value[..50] + "\u2026" : value;
                    var shownPattern = pattern.Length > 50 ? pattern[..50] + "\u2026" : pattern;
                    throw new HyperlambdaException(
                        $"'{shownValue}' does not conform to regular expression of '{shownPattern}' for [{name}]",
                        true,
                        400,
                        name);
                }
            });
        }

        #region [ -- Private helper methods -- ]

        /*
         * Resolves the regex match timeout from the remaining execution deadline, when one
         * exists - a small margin ahead of it, so the timeout exception is raised, and the
         * surrounding error handling runs, before the execution token is cancelled.
         */
        static TimeSpan MatchTimeout(ISignaler signaler)
        {
            var context = signaler.Peek<ExecutionContext>("execution.context");
            if (context?.DeadlineUtc == null)
                return Regex.InfiniteMatchTimeout;

            var remaining = context.DeadlineUtc.Value - DateTime.UtcNow - TimeSpan.FromMilliseconds(250);
            return remaining <= TimeSpan.Zero ? TimeSpan.FromMilliseconds(1) : remaining;
        }

        #endregion
    }
}
