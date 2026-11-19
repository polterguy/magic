/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Linq;
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
        ValueKind = "number",
        ValueDescription = "Base operand compared with the child operands; omit to use the first child operand as the base. Without children, an expression supplies every operand, one per node it matches",
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "number",
        ReturnsDescription = "Resolves to the smallest supplied value",
        SignatureType = typeof(global::magic.lambda.math.signatures.ExtremumSignature))]
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
            var operands = Utilities.AllOperands(input);
            dynamic cur = operands[0];
            foreach (var idx in operands.Skip(1))
            {
                if (idx < cur)
                    cur = idx;
            }
            input.Clear();
            input.Value = cur;
        }
    }
}
