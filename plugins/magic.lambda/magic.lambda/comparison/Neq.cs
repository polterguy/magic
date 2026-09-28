/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.comparison
{
    /// <summary>
    /// [neq] slot allowing you to compare two values for not equality.
    /// </summary>
    [Slot(
        Name = "neq",
        Description = "Returns true if two operands are not equal",
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "boolean",
        ReturnsDescription = "Resolves to true if the operands are not equal",
        SignatureType = typeof(global::magic.lambda.signatures.ComparisonSignature))]
    public class Neq : ISlot
    {
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        /// <returns>An awaitable task.</returns>
        public void Signal(ISignaler signaler, Node input)
        {
            signaler.Signal("eq", input, skipWhitelist: true);
            input.Value = !input.Get<bool>();
        }
    }
}
