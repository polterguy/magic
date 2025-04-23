/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using magic.node;
using magic.signals.contracts;
using magic.lambda.logging.contracts;

namespace magic.lambda.logging.slots
{
    /// <summary>
    /// [log.capabilities] slot for returning the capabilities of the log implementation.
    /// </summary>
    [Slot(Name = "log.capabilities")]
    public class Capabilities : ISlot
    {
        readonly ILogQuery _query;

        /// <summary>
        /// Creates an instance of your type.
        /// </summary>
        /// <param name="query">Actual implementation.</param>
        public Capabilities(ILogQuery query)
        {
            _query = query;
        }

        /// <summary>
        /// Slot implementation.
        /// </summary>
        /// <param name="signaler">Signaler that raised the signal.</param>
        /// <param name="input">Arguments to slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var cap = _query.Capabilities();
            input.Add(new Node("can-filter", cap.CanFilter));
            input.Add(new Node("can-timeshift", cap.CanTimeShift));
        }
    }
}
