/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Threading;
using Org.BouncyCastle.Security;

namespace magic.lambda.crypto.slots.misc
{
    /*
     * Process-wide cryptographically secure RNG shared by [crypto.random], [crypto.random.int]
     * and [crypto.seed].
     *
     * A single shared generator is what makes [crypto.seed] meaningful: entropy added there is
     * mixed into the same instance the random slots draw from, so it actually influences the
     * values they subsequently produce. Previously each slot created its own throwaway
     * SecureRandom, so [crypto.seed] seeded an instance nobody ever used.
     *
     * Access is synchronised because the instance is shared across request threads. Mixing extra
     * seed material into a CSPRNG only ever adds entropy, so interleaved draws stay secure.
     */
    internal static class SharedRandom
    {
        static readonly SecureRandom _rnd = new SecureRandom();
        static readonly Lock _lock = new();

        /// <summary>
        /// Mixes additional seed material into the shared generator.
        /// </summary>
        public static void AddSeed(byte[] seed)
        {
            lock (_lock)
                _rnd.SetSeed(seed);
        }

        /// <summary>
        /// Fills the supplied buffer with cryptographically secure random bytes.
        /// </summary>
        public static void NextBytes(byte[] buffer)
        {
            lock (_lock)
                _rnd.NextBytes(buffer);
        }

        /// <summary>
        /// Returns a random integer in the range [min, max).
        /// </summary>
        public static int Next(int min, int max)
        {
            lock (_lock)
                return _rnd.Next(min, max);
        }
    }
}
