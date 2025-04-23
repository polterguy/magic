/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Threading.Tasks;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.lambda.logging.contracts;

namespace magic.lambda.logging.slots
{
    /// <summary>
    /// [log.get] slot for retrieving a single log item given a specified ID.
    /// </summary>
    [Slot(Name = "log.get")]
    public class Get : ISlotAsync
    {
        readonly ILogQuery _query;

        /// <summary>
        /// Creates an instance of your type.
        /// </summary>
        /// <param name="query">Actual implementation.</param>
        public Get(ILogQuery query)
        {
            _query = query;
        }

        /// <summary>
        /// Slot implementation.
        /// </summary>
        /// <param name="signaler">Signaler that raised the signal.</param>
        /// <param name="input">Arguments to slot.</param>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            // Retrieving ID caller needs.
            var id = input.GetEx<object>() ?? throw new HyperlambdaException("No id specified to [log.get]");

            // House cleaning.
            input.Clear();
            input.Value = null;

            // Retrieving item and returning result to caller.
            var item = await _query.Get(id);
            input.Add(new Node("id", item.Id));
            input.Add(new Node("type", item.Type));
            input.Add(new Node("created", item.Created));
            input.Add(new Node("content", item.Content));
            if (!string.IsNullOrEmpty(item.Exception))
                input.Add(new Node("exception", item.Exception));

            // Retrieving meta.
            if (item.Meta != null && item.Meta.Any())
            {
                var metaNode = new Node("meta");
                metaNode.AddRange(item.Meta.Select(x => new Node(x.Key, x.Value)));
                input.Add(metaNode);
            }
        }
    }
}
