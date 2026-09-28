/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Threading.Tasks;
using magic.node;
using magic.signals.contracts;
using magic.lambda.math.utilities;

namespace magic.lambda.math.helpers
{
    /// <summary>
    /// [math.modulo] slot for performing division.
    /// </summary>
    [Slot(
        Name = "math.modulo",
        Description = "Calculates the remainder of a division",
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "number",
        ReturnsDescription = "Resolves to the remainder of the modulo operation",
        SignatureType = typeof(global::magic.lambda.math.signatures.ArithmeticSignature))]
    public class Modulation : ISlotAsync
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
            dynamic sum = Utilities.GetBase(input);
            foreach (var idx in Utilities.AllButBase(input))
            {
                sum %= idx;
            }
            input.Clear();
            input.Value = sum;
        }
    }
}
