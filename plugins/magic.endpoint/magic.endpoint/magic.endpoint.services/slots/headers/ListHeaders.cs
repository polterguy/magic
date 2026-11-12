/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Linq;
using magic.node;
using magic.signals.contracts;
using magic.endpoint.contracts.poco;

namespace magic.endpoint.services.slots.headers
{
    /// <summary>
    /// [request.headers.list] slot for listing all HTTP headers specified by the client
    /// as a part of the HTTP request object.
    /// 
    /// Notice, this slot also returns the values of each HTTP headers, in addition to
    /// their names, as a key/value collection returned back to the client.
    /// </summary>
    [Slot(
        Name = "request.headers.list",
        Description = "Lists request headers",
        ReturnsMode = SlotReturnsMode.Lambda,
        ReturnsKind = "http-header-map,lambda-tree",
        ReturnsElementKind = "http-header-value,text",
        ReturnsDescription = "Resolves to one child node per request header, with the header name as the node name and its value as the node value",
        SignatureType = typeof(global::magic.signals.contracts.NoChildrenSignature))]
    public class ListHeaders : ISlot
    {
        /// <summary>
        /// Implementation of your slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise signal.</param>
        /// <param name="input">Arguments to your slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var request = signaler.Peek<MagicRequest>("http.request");
            input.AddRange(request.Headers.Select(x => new Node(x.Key, x.Value)));
        }
    }
}
