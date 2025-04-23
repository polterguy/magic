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
    /// [and] slot allowing you to group multiple comparisons (for instance), where all of these must evaluate
    /// to true, for the [and] slot as a whole to evaluate to true.
    /// </summary>
    [Slot(Name = "and")]
    public class And : ISlot
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
            input.Value = !Common.Signal(signaler, input, false);
        }

        #region [ -- Private helper methods -- ]

        static void SanityCheck(Node input)
        {
            if (input.Children.Count() < 2)
                throw new HyperlambdaException("[and] must have at least two children nodes");
        }

        #endregion
    }
}
