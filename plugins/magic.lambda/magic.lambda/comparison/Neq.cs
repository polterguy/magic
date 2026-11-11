/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using System.Threading.Tasks;

namespace magic.lambda.comparison
{
    /// <summary>
    /// [neq] slot allowing you to compare two values for not equality.
    /// </summary>
    [Slot(
        Name = "neq",
        Description = "Returns true if two operands are not equal",
        ValueKind = "object",
        ValueDescription = "Left-hand operand, compared against the single child operand; omit to compare two child operands instead",
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "boolean",
        ReturnsDescription = "Resolves to true if the operands are not equal",
        SignatureType = typeof(global::magic.lambda.signatures.ComparisonSignature))]
    public class Neq : ISlotAsync
    {
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        /// <returns>An awaitable task.</returns>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            await signaler.SignalAsync("eq", input, skipWhitelist: true);
            input.Value = !input.Get<bool>();
        }
    }
}
