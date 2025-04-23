/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.endpoint.contracts.poco;

namespace magic.endpoint.services.slots.headers
{
    /// <summary>
    /// [response.headers.set] slot for adding a Response HTTP header that will be
    /// returned back to the client as an HTTP header.
    /// </summary>
    [Slot(Name = "response.headers.set")]
    public class SetHeader : ISlot
    {
        /// <summary>
        /// Implementation of your slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise signal.</param>
        /// <param name="input">Arguments to your slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var response = signaler.Peek<MagicResponse>("http.response");
            foreach (var idx in input.Children)
            {
                response.Headers[idx.Name] = idx.GetEx<string>();
            }
        }
    }
}
