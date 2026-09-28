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
    /// [not] slot, negating the value of its first children's value.
    /// </summary>
    [Slot(
        Name = "not",
        Description = "Negates a boolean expression",
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "boolean",
        ReturnsDescription = "Resolves to true if the operand evaluates to false",
        SignatureType = typeof(global::magic.lambda.signatures.SingleLogicalOperandSignature))]
    public class Not : ISlot
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
            signaler.Signal("eval", input, skipWhitelist: true);
            input.Value = !input.Children.First().GetEx<bool>();
        }

        #region [ -- Private helper methods -- ]

        static void SanityCheck(Node input)
        {
            if (input.Children.Count() != 1)
                throw new HyperlambdaException("[not] can have maximum one child node");
        }

        #endregion
    }
}
