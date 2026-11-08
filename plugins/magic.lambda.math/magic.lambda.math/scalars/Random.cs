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
        Description = "Returns a random number from optional child-node bounds",
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
            if (!input.Children.Any())
            {
                // No arguments, returning random double between 0.0 and 1.0.
                input.Value = System.Random.Shared.NextDouble();
            }
            else if (input.Children.Count() == 1)
            {
                // One argument, returning random integer between 0 and argument.
                var max = input.Children.First().GetEx<int>();
                if (max < 0)
                    throw new HyperlambdaException("[math.random] [max] cannot be negative");
                input.Value = System.Random.Shared.Next(max);
            }
            else
            {
                // Two arguments, returning random integer between min and max.
                // Notice, we expect arguments to be named 'min' and 'max', but we don't enforce it, we just take first and second.
                var min = input.Children.First().GetEx<int>();
                var max = input.Children.Skip(1).First().GetEx<int>();
                if (min > max)
                    throw new HyperlambdaException("[math.random] [min] cannot be greater than [max]");
                input.Value = System.Random.Shared.Next(min, max);
            }
        }
    }
}
