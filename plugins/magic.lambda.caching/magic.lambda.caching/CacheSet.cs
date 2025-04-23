/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Threading.Tasks;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.lambda.caching.contracts;

namespace magic.lambda.caching
{
    /// <summary>
    /// [cache.set] slot saving its first child node's value to the memory cache.
    /// </summary>
    [Slot(Name = "cache.set")]
    public class CacheSet : ISlotAsync
    {
        readonly IMagicCache _cache;

        /// <summary>
        /// Creates an instance of your type.
        /// </summary>
        /// <param name="cache">Actual implementation.</param>
        public CacheSet(IMagicCache cache)
        {
            _cache = cache;
        }

        /// <summary>
        /// Slot implementation.
        /// </summary>
        /// <param name="signaler">Signaler that raised the signal.</param>
        /// <param name="input">Arguments to slot.</param>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            var key = input.GetEx<string>() ?? throw new HyperlambdaException("[cache.set] must be given a key");

            var val = input
                .Children
                .FirstOrDefault(x => x.Name == "value")?
                .GetEx<string>();

            // Checking if value is null, at which point we simply remove cached item.
            if (val == null)
            {
                await _cache.RemoveAsync(key);
                return;
            }

            // Caller wants to actually save an object to cache.
            var expiration = input
                .Children
                .FirstOrDefault(x => x.Name == "expiration")?
                .GetEx<long>() ?? 5;

            await _cache.UpsertAsync(key, val, DateTime.UtcNow.AddSeconds(expiration));
        }
    }
}
