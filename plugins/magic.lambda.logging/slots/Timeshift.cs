/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Globalization;
using System.Threading.Tasks;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.lambda.logging.contracts;

namespace magic.lambda.logging.slots
{
    /// <summary>
    /// [log.timeshift] slot for querying log items by specified content in a timeshift series
    /// over the last 2 weeks.
    /// </summary>
    [Slot(Name = "log.timeshift")]
    public class Timeshift : ISlotAsync
    {
        readonly ILogQuery _query;

        /// <summary>
        /// Creates an instance of your type.
        /// </summary>
        /// <param name="query">Actual implementation.</param>
        public Timeshift(ILogQuery query)
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
          // Retrieving timeshift data.
            var result = await _query.Timeshift(
              input.GetEx<string>() ?? throw new HyperlambdaException("No value provided to [log.timeshift]"));

            // House cleaning.
            input.Value = null;

            // Iterating backwards in time for two weeks.
            var curDate = DateTime.UtcNow;
            var stop = DateTime.UtcNow.AddDays(-14);
            while (curDate > stop)
            {
                // Figuring out which day we're currently handling.
                var curDateStr = curDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);

                // Adding data for currently iterated day.
                var idxNode = new Node(".");
                idxNode.Add(new Node("when", curDateStr));
                idxNode.Add(new Node("count", result.FirstOrDefault(x => x.When == curDateStr).Count));
                input.Add(idxNode);

                // Decrementing currently iterated day by one.
                curDate = curDate.AddDays(-1);
            }
        }
    }
}
