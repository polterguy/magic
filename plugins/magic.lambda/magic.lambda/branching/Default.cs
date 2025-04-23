/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.branching
{
    /// <summary>
    /// [default] slot for [switch] slots.
    /// </summary>
    [Slot(Name = "default")]
    public class Default : ISlot
    {
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        /// <returns>An awaitable task.</returns>
        public void Signal(ISignaler signaler, Node input)
        {
            SanityCheckInvocation(input);
            signaler.Signal("eval", input);
        }

        #region [ -- Private helper methods -- ]

        void SanityCheckInvocation(Node input)
        {
            if (input.Parent?.Name != "switch")
                throw new HyperlambdaException("[default] must be a child of [switch]");
        }

        #endregion
    }
}
