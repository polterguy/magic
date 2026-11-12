/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using magic.node;
using magic.signals.contracts;
using magic.endpoint.contracts.poco;

namespace magic.endpoint.services.slots.misc
{
    /// <summary>
    /// [request.host] slot for returning the host the request was decorated with.
    /// </summary>
    [Slot(
        Name = "request.host",
        Description = "Returns the host header (domain and optional port) of the current incoming request",
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "host-name,text",
        ReturnsDescription = "Resolves to the host name from the current request",
        SignatureType = typeof(global::magic.signals.contracts.NoChildrenSignature))]
    public class GetHost : ISlot
    {
        /// <summary>
        /// Implementation of your slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise signal.</param>
        /// <param name="input">Arguments to your slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var request = signaler.Peek<MagicRequest>("http.request");
            input.Value = request.Host;
        }
    }
}
