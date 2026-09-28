/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Threading.Tasks;
using magic.node;
using magic.signals.contracts;
using magic.lambda.math.utilities;

namespace magic.lambda.math.basics
{
    /// <summary>
    /// [math.max] slot for finding min value.
    /// </summary>
    [Slot(
        Name = "math.min",
        Description = "Returns the smallest value from the supplied inputs",
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "number",
        ReturnsDescription = "Resolves to the smallest supplied value",
        SignatureType = typeof(global::magic.lambda.math.signatures.ArithmeticSignature))]
    public class Min : ISlotAsync
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
            dynamic cur = Utilities.GetBase(input);
            foreach (var idx in Utilities.AllButBase(input))
            {
                if (idx < cur)
                    cur = idx;
            }
            input.Clear();
            input.Value = cur;
        }
    }
}
