/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System;
using System.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.math.scalars
{
    /// <summary>
    /// [math.random] slot for creating random numbers.
    /// </summary>
    [Slot(
        Name = "math.random",
        Description = "Returns a random number, an integer between the [min] and [max] children when [max] is given",
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "number",
        ReturnsDescription = "Resolves to a random double, or a random integer when bounds are supplied",
        SignatureType = typeof(global::magic.lambda.math.signatures.RandomSignature))]
    public class Random : ISlot
    {
        /// <summary>
        /// Implementation of slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise the signal.</param>
        /// <param name="input">Arguments to slot.</param>
        /// <returns>An awaitable task.</returns>
        public void Signal(ISignaler signaler, Node input)
        {
            // Bounds are only ever read from [min] and [max], whose values may be expressions.
            var unknown = input.Children.FirstOrDefault(x => x.Name != "min" && x.Name != "max");
            if (unknown != null)
                throw new HyperlambdaException($"[math.random] only accepts [min] and [max] children, not [{unknown.Name}]");
            var minNode = input.Children.FirstOrDefault(x => x.Name == "min");
            var maxNode = input.Children.FirstOrDefault(x => x.Name == "max");

            if (maxNode == null)
            {
                if (minNode != null)
                    throw new HyperlambdaException("[math.random] [min] requires [max]");

                // No bounds, returning random double between 0.0 and 1.0.
                input.Value = System.Random.Shared.NextDouble();
                return;
            }

            // Returning random integer between [min], defaulting to 0, and [max], exclusive.
            var max = maxNode.GetEx<int>();
            var min = minNode?.GetEx<int>() ?? 0;
            if (minNode == null && max < 0)
                throw new HyperlambdaException("[math.random] [max] cannot be negative");
            if (min > max)
                throw new HyperlambdaException("[math.random] [min] cannot be greater than [max]");
            input.Value = System.Random.Shared.Next(min, max);
        }
    }
}
