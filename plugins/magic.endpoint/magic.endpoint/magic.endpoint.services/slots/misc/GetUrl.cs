/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using magic.node;
using magic.signals.contracts;
using magic.endpoint.contracts.poco;

namespace magic.endpoint.services.slots.misc
{
    /// <summary>
    /// [request.url] slot for returning the URL the request was decorated with.
    /// </summary>
    [Slot(Name = "request.url")]
    public class GetUrl : ISlot
    {
        /// <summary>
        /// Implementation of your slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise signal.</param>
        /// <param name="input">Arguments to your slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var request = signaler.Peek<MagicRequest>("http.request");
            input.Value = request.URL;
            input.Clear();
            foreach (var idx in request.Query)
            {
                input.Add(new Node(idx.Key, idx.Value));
            }
        }
    }
}
