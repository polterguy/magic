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
    /// [cache.clear] slot clearing memory cache entirely, or optionally taking a filter
    /// declaring which items to clear.
    /// </summary>
    [Slot(Name = "cache.clear")]
    public class CacheClear : ISlotAsync
    {
        readonly IMagicCache _cache;
 
        /// <summary>
        /// Creates an instance of your type.
        /// </summary>
        /// <param name="cache">Actual implementation.</param>
        public CacheClear(IMagicCache cache)
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
            await _cache.ClearAsync(filter);
        }
    }
}
