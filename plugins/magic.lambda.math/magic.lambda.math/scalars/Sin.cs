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
    [Slot(Name = "math.sin")]
    public class Sin : ISlot
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
            input.Value = Math.Sin(original);
        }
    }
}
