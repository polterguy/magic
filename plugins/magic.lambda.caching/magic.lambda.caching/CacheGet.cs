/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Threading.Tasks;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.lambda.caching.contracts;

namespace magic.lambda.caching
{
    /// <summary>
    /// [cache.get] slot returning an item from the cache, if existing.
    /// </summary>
    [Slot(
        Name = "cache.get",
        Description = "Returns a cached value by key",
        ValueKind = "cache-key",
        ValueDescription = "Cache key to retrieve",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "cache-value,text",
        ReturnsDescription = "Resolves to the cached value, or null if the key does not exist",
        SignatureType = typeof(global::magic.signals.contracts.NoChildrenSignature))]
    public class CacheGet : ISlotAsync
    {
        readonly IMagicCache _cache;

        /// <summary>
        /// Creates an instance of your type.
        /// </summary>
        /// <param name="cache">Actual implementation.</param>
        public CacheGet(IMagicCache cache)
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
            input.Value = await _cache.GetAsync(input.GetEx<string>());
        }
    }
}
