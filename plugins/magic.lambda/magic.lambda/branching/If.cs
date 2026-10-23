/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using magic.node;
using magic.signals.contracts;
using System.Threading.Tasks;

namespace magic.lambda.branching
{
    /// <summary>
    /// [if] slot, allowing you to branch in your code execution according to some condition.
    /// </summary>
    [Slot(
        Name = "if",
        Description = "Evaluates the child lambda only if the condition is true; chain with [else-if] and [else] for additional branches",
        ReturnsMode = SlotReturnsMode.None,
        ProvidesScope = "if",
        SignatureType = typeof(global::magic.lambda.signatures.ConditionalBlockSignature))]
    public class If : ISlotAsync
    {
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        /// <returns>An awaitable task.</returns>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            // Checking if we should evaluate lambda object.
            if (!await Common.ConditionIsTrue(signaler, input))
            {
                // Result of condition yields false.
                input.Value = false;
                return;
            }

            // Result of condition yields true. ORDER COUNTS!
            await signaler.SignalAsync("eval", Common.GetLambda(input), skipWhitelist: true);
            input.Value = true;
        }
    }
}
