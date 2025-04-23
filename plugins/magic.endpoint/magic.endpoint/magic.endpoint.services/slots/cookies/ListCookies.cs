/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using magic.node;
using magic.signals.contracts;
using magic.endpoint.contracts.poco;

namespace magic.endpoint.services.slots.cookies
{
    /// <summary>
    /// [request.cookies.list] slot for listing all cookies attached to the request.
    /// </summary>
    [Slot(Name = "request.cookies.list")]
    public class ListCookies : ISlot
    {
        /// <summary>
        /// Implementation of your slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise signal.</param>
        /// <param name="input">Arguments to your slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var request = signaler.Peek<MagicRequest>("http.request");
            input.AddRange(request.Cookies.Select(x => new Node(x.Key, x.Value)));
        }
    }
}
