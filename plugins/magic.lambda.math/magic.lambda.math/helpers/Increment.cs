/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Threading.Tasks;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.lambda.math.utilities;

namespace magic.lambda.math.helpers
{
    /// <summary>
    /// [math.increment] slot for incrementing some value, optionally by a [step] argument.
    /// </summary>
    [Slot(
        Name = "math.increment",
        Description = "Increments the numeric nodes selected by the input expression",
        ValueKind = "numeric-node",
        ValueDescription = "Expression selecting the numeric node or nodes to increment",
        ValueRequired = true,
        ValueMode = SlotValueMode.Expression,
        ReturnsMode = SlotReturnsMode.None,
        SignatureType = typeof(global::magic.lambda.math.signatures.IncrementDecrementSignature))]
    public class Increment : ISlotAsync
    {
        /// <summary>
        /// Implementation of slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise the signal.</param>
        /// <param name="input">Arguments to slot.</param>
        /// <returns>An awaitable task.</returns>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            await signaler.SignalAsync("eval", input, skipWhitelist: true);
            var step = Utilities.GetStep(input);
            foreach (var idx in input.Evaluate())
            {
                idx.Value = idx.Get<dynamic>() + step;
            }
            input.Clear();
        }
    }
}
