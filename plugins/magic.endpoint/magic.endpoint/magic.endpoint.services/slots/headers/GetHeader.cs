/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.endpoint.contracts.poco;

namespace magic.endpoint.services.slots.headers
{
    /// <summary>
    /// [request.headers.get] slot for retrieving the value of the specified HTTP header
    /// passed in by the client over the HTTP request.
    /// </summary>
    [Slot(
        Name = "request.headers.get",
        Description = "Returns a request header by name",
        ValueKind = "http-header-name",
        ValueDescription = "Header name to retrieve",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "http-header-value,text",
        ReturnsDescription = "Resolves to the value of the named request header, or null if it does not exist",
        SignatureType = typeof(global::magic.signals.contracts.NoChildrenSignature))]
    public class GetHeader : ISlot
    {
        /// <summary>
        /// Implementation of your slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise signal.</param>
        /// <param name="input">Arguments to your slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var request = signaler.Peek<MagicRequest>("http.request");
            var key = input.GetEx<string>();
            if (request.Headers.TryGetValue(key, out string value))
                input.Value = value;
            else
                input.Value = null;
        }
    }
}
