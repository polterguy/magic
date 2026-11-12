/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file
 * for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.math.scalars
{
    /// <summary>
    /// [math.floor] slot for rounding numbers down.
    /// </summary>
    [Slot(
        Name = "math.floor",
        Description = "Rounds a number down",
        ValueKind = "number",
        ValueDescription = "Numeric value to round",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "number",
        ReturnsDescription = "Resolves to the rounded-down value",
        SignatureType = typeof(global::magic.signals.contracts.NoChildrenSignature))]
    public class Floor : ISlot
    {
        /// <summary>
        /// Implementation of slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise the signal.</param>
        /// <param name="input">Arguments to slot.</param>
        /// <returns>An awaitable task.</returns>
        public void Signal(ISignaler signaler, Node input)
        {
            dynamic original = input.GetEx<dynamic>();
            input.Value = Math.Floor(original);
        }
    }
}
