/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Text;
using Org.BouncyCastle.Security;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.crypto.slots.misc
{
    /// <summary>
    /// [crypto.random.int] slot to create a random integer value.
    /// </summary>
    [Slot(Name = "crypto.random.int")]
    public class RandomInteger : ISlot
    {
        /// <summary>
        /// Implementation of slot.
        /// </summary>
        /// <param name="signaler">Signaler invoking slot.</param>
        /// <param name="input">Arguments to slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            // Retrieving arguments.
            var max = input.Children.FirstOrDefault(x => x.Name == "max")?.GetEx<int>() ?? int.MaxValue;
            var seed = input.Children.FirstOrDefault(x => x.Name == "seed")?.GetEx<string>();

            // Creating a new CSRNG, seeding it if caller provided a [seed].
            var rnd = new SecureRandom();
            if (!string.IsNullOrEmpty(seed))
                rnd.SetSeed(Encoding.UTF8.GetBytes(seed));

            // Retrieving a random number of bytes, between min/max values provided by caller.
            var bytes = new byte[4];
            rnd.NextBytes(bytes);

            // Assigning result to caller.
            var result = BitConverter.ToInt32(bytes, 0);
            result = Math.Abs(result);
            input.Value = result % max;

            // House cleaning.
            input.Clear();
        }
    }
}
