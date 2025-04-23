/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Threading.Tasks;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.lambda.caching.contracts;

namespace magic.lambda.caching
{
    /// <summary>
    /// [cache.count] slot returning the number of cacheds items matching
    /// optional filter to caller.
    /// </summary>
    [Slot(Name = "cache.count")]
    public class CacheCount : ISlotAsync
    {
        readonly IMagicCache _cache;

        /// <summary>
        /// Creates an instance of your type.
        /// </summary>
        /// <param name="cache">Actual implementation.</param>
        public CacheCount(IMagicCache cache)
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
            var filter = input.GetEx<string>() ?? input
                .Children
                .FirstOrDefault(x => x.Name == "filter")?
                .GetEx<string>();
            input.Clear();
            input.Value = null;
            input.Value = (await _cache.ItemsAsync(filter)).Count();
        }
    }
}
