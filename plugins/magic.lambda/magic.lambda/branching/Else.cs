/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using magic.node;
using magic.signals.contracts;

namespace magic.lambda.branching
{
    /// <summary>
    /// [else] slot for matching with an [if] and/or [else-if] slot. Must come after either or the previously mentioned slots.
    /// </summary>
    [Slot(Name = "else")]
    public class Else : ISlot
    {
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        /// <returns>An awaitable task.</returns>
        public void Signal(ISignaler signaler, Node input)
        {
            // Sanity checking invocation.
            Common.SanityCheckElse(input);

            // Checking if previous condition was true, and if so we don't evaluate else.
            if (!Common.ShouldEvaluateElse(input))
            {
                // Previous [if] or [else-if] yielded true.
                input.Value = false;
                return;
            }

            // Results of all previous conditions yielded false, hence evaluating.
            input.Value = true;
            signaler.Signal("eval", input);
        }
    }
}
