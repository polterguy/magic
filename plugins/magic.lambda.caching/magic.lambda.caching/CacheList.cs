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
    /// [cache.list] slot returning all cache items to caller.
    /// </summary>
    [Slot(Name = "cache.list")]
    public class CacheList : ISlotAsync
    {
        readonly IMagicCache _cache;

        /// <summary>
        /// Creates an instance of your type.
        /// </summary>
        /// <param name="cache">Actual implementation.</param>
        public CacheList(IMagicCache cache)
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
            var offset = input
                .Children
                .FirstOrDefault(x => x.Name == "offset")?
                .GetEx<int>() ?? 0;

            var limit = input
                .Children
                .FirstOrDefault(x => x.Name == "limit")?
                .GetEx<int>() ?? 10;

            var filter = input.GetEx<string>() ?? input
                .Children
                .FirstOrDefault(x => x.Name == "filter")?
                .GetEx<string>();

            input.Clear();
            input.Value = null;

            var items = (await _cache.ItemsAsync(filter, false))
                .Skip(offset)
                .Take(limit)
                .OrderBy(x => x.Key);

            input.AddRange(
                items
                    .Select(x => new Node(".", null, new Node[] {
                        new Node("key", x.Key),
                        new Node("value", x.Value)
                    })));
        }
    }
}
