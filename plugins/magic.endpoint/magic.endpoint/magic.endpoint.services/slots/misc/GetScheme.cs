/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using magic.node;
using magic.signals.contracts;
using magic.endpoint.contracts.poco;

namespace magic.endpoint.services.slots.misc
{
    /// <summary>
    /// [request.scheme] slot for returning the scheme of the request.
    /// </summary>
    [Slot(
        Name = "request.scheme",
        Description = "Returns the scheme (http or https) of the current incoming request",
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "http-scheme,text",
        ReturnsDescription = "Resolves to the scheme of the current request, such as http or https",
        SignatureType = typeof(global::magic.signals.contracts.NoChildrenSignature))]
    public class GetScheme : ISlot
    {
        /// <summary>
        /// Implementation of your slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise signal.</param>
        /// <param name="input">Arguments to your slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var request = signaler.Peek<MagicRequest>("http.request");
            input.Value = request.Scheme;
        }
    }
}
