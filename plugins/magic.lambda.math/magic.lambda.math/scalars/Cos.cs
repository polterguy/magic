/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.math.scalars
{
    /// <summary>
    /// [math.cos] slot for finding cosin.
    /// </summary>
    [Slot(
        Name = "math.cos",
        Description = "Calculates the cosine of the specified value",
        ValueKind = "number",
        ValueDescription = "Numeric value to transform",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "number",
        ReturnsDescription = "Resolves to the cosine of the supplied angle")]
    public class Cos : ISlot
    {
        /// <summary>
        /// Implementation of slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise the signal.</param>
        /// <param name="input">Arguments to slot.</param>
        /// <returns>An awaitable task.</returns>
        public void Signal(ISignaler signaler, Node input)
        {
            var original = input.GetEx<double>();
            input.Value = Math.Cos(original);
        }
    }
}
