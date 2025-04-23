/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.logical
{
    /// <summary>
    /// [or] slot allowing you to group multiple comparisons (for instance), where at least one of these must evaluate
    /// to true, for the [or] slot as a whole to evaluate to true.
    /// </summary>
    [Slot(Name = "or")]
    public class Or : ISlot
    {
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        /// <returns>An awaitable task.</returns>
        public void Signal(ISignaler signaler, Node input)
        {
            SanityCheck(input);
            input.Value = Common.Signal(signaler, input, true);
        }

        #region [ -- Private helper methods -- ]

        void SanityCheck(Node input)
        {
            if (input.Children.Count() < 2)
                throw new HyperlambdaException("[or] must have at least 2 argument nodes");
        }

        #endregion
    }
}
