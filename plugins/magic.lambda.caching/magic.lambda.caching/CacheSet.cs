/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
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
    [Slot(
        Name = "cache.set",
        Description = "Stores a value in the in-memory cache under a key, with an optional sliding expiration",
        ValueKind = "cache-key",
        ValueDescription = "Cache key to store",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.None,
        SignatureType = typeof(global::magic.lambda.caching.signatures.CacheSetSignature))]
    public class CacheSet : ISlotAsync
    {
        const long MaxExpirationSeconds = 315_360_000; // Ten years.

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
            if (expiration < 1 || expiration > MaxExpirationSeconds)
                throw new HyperlambdaException($"[expiration] must be between 1 and {MaxExpirationSeconds} seconds");

            await _cache.UpsertAsync(key, val, DateTime.UtcNow.AddSeconds(expiration));
        }
    }
}
