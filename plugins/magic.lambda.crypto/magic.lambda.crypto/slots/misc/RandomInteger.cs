/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
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
    [Slot(
        Name = "crypto.random.int",
        Description = "Returns a cryptographically secure random integer; use the optional [max] to cap the upper bound",
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "random-number,integer,number",
        ReturnsDescription = "Resolves to a random integer less than the optional [max] value",
        SignatureType = typeof(global::magic.lambda.crypto.signatures.CryptoRandomIntegerSignature))]
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

            // Sanity checking invocation, since [max] is the exclusive upper bound and must be positive.
            if (max <= 0)
                throw new HyperlambdaException("[max] must be a positive integer for [crypto.random.int]");

            // Creating a new CSRNG, seeding it if caller provided a [seed].
            var rnd = new SecureRandom();
            if (!string.IsNullOrEmpty(seed))
                rnd.SetSeed(Encoding.UTF8.GetBytes(seed));

            /*
             * Returning a uniformly distributed integer in the range [0, max).
             *
             * We read 4 random bytes as an unsigned 32 bit value and apply rejection sampling,
             * discarding the small unusable tail so that values of [max] that do not divide 2^32
             * evenly are not biased towards the lower end of the range. We deliberately avoid
             * Math.Abs(BitConverter.ToInt32(...)), which throws an OverflowException on the one
             * input where the random bytes decode to int.MinValue.
             */
            var upperBound = (uint)max;
            var reject = (uint)(((ulong)uint.MaxValue + 1UL) % upperBound);
            var bytes = new byte[4];
            uint value;
            do
            {
                rnd.NextBytes(bytes);
                value = BitConverter.ToUInt32(bytes, 0);
            }
            while (value < reject);

            // Assigning result to caller.
            input.Value = (int)(value % upperBound);

            // House cleaning.
            input.Clear();
        }
    }
}
