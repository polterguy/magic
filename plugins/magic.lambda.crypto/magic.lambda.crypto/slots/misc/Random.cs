/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Text;
using Org.BouncyCastle.Security;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.crypto.slots.misc
{
    /// <summary>
    /// [crypto.random] slot to create a bunch of cryptographically secured random characters.
    /// </summary>
    [Slot(
        Name = "crypto.random",
        Description = "Returns a cryptographically secure random string or random bytes",
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "random-content,binary-content",
        ReturnsDescription = "Resolves to a random string, or random bytes when [raw] is true",
        SignatureType = typeof(global::magic.lambda.crypto.signatures.CryptoRandomSignature))]
    public class Random : ISlot
    {
        const int _maxLength = 4096;
        const string _alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

        /// <summary>
        /// Implementation of slot.
        /// </summary>
        /// <param name="signaler">Signaler invoking slot.</param>
        /// <param name="input">Arguments to slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            // Retrieving arguments.
            var min = input.Children.FirstOrDefault(x => x.Name == "min")?.GetEx<int>() ?? 10;
            var max = input.Children.FirstOrDefault(x => x.Name == "max")?.GetEx<int>() ?? (min == 10 ? 20 : min);
            var raw = input.Children.FirstOrDefault(x => x.Name == "raw")?.GetEx<bool>() ?? false;
            var seed = input.Children.FirstOrDefault(x => x.Name == "seed")?.GetEx<string>();

            // Bounding output size before allocating, since these arguments may originate from sandboxed callers.
            if (min < 0 || max < min || max > _maxLength)
                throw new HyperlambdaException($"[min] and [max] must be between 0 and {_maxLength}, and [max] cannot be less than [min]");

            // Creating a new CSRNG, seeding it if caller provided a [seed].
            var rnd = new SecureRandom();
            if (!string.IsNullOrEmpty(seed))
                rnd.SetSeed(Encoding.UTF8.GetBytes(seed));

            // Retrieving a random number of bytes, between min/max values provided by caller.
            var bytes = new byte[rnd.Next(min, max)];
            rnd.NextBytes(bytes);

            // Returning in the format requested by caller.
            input.Value = raw ? (object)bytes : string.Concat(bytes.Select(x => _alphabet[x % (_alphabet.Length)]));

            // House cleaning.
            input.Clear();
        }
    }
}
