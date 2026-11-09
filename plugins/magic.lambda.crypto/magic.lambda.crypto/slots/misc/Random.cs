/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Linq;
using System.Text;
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

            // Mixing any caller supplied [seed] into the shared CSPRNG before drawing from it.
            if (!string.IsNullOrEmpty(seed))
                SharedRandom.AddSeed(Encoding.UTF8.GetBytes(seed));

            // Retrieving a random number of bytes, between min/max values provided by caller.
            var length = SharedRandom.Next(min, max);
            var bytes = new byte[length];
            SharedRandom.NextBytes(bytes);

            // Returning in the format requested by caller.
            if (raw)
            {
                input.Value = bytes;
            }
            else
            {
                /*
                 * Mapping random bytes onto our alphabet using rejection sampling. A plain
                 * modulo would bias the first (256 % alphabet length) characters, since those
                 * residues occur for one more byte value than the rest, measurably skewing the
                 * distribution of any secret generated through this slot. We therefore discard
                 * byte values in the final partial block so that every character is equally likely,
                 * drawing fresh bytes in batches until the requested length has been produced.
                 */
                var limit = 256 - (256 % _alphabet.Length);
                var result = new StringBuilder(length);
                var block = bytes;
                while (true)
                {
                    foreach (var b in block)
                    {
                        if (b < limit)
                        {
                            result.Append(_alphabet[b % _alphabet.Length]);
                            if (result.Length == length)
                                break;
                        }
                    }
                    if (result.Length == length)
                        break;
                    block = new byte[length - result.Length];
                    SharedRandom.NextBytes(block);
                }
                input.Value = result.ToString();
            }

            // House cleaning.
            input.Clear();
        }
    }
}
