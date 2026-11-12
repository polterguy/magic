/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.endpoint.contracts.poco;

namespace magic.endpoint.services.slots.misc
{
    /// <summary>
    /// [response.status.set] slot for modifying the HTTP status code of the response.
    /// </summary>
    [Slot(
        Name = "response.status.set",
        Description = "Overrides the HTTP status code returned to the caller (e.g. 201 Created, 404 Not Found, 500 Internal Error)",
        ValueKind = "http-status-code,integer,number",
        ValueDescription = "HTTP status code to set",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.None,
        SignatureType = typeof(global::magic.signals.contracts.NoChildrenSignature))]
    public class SetStatusCode : ISlot
    {
        /// <summary>
        /// Implementation of your slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise signal.</param>
        /// <param name="input">Arguments to your slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var response = signaler.Peek<MagicResponse>("http.response");
            if (response != null) // Avoiding trying to change status unless we actually have an HTTP context.
                response.Result = input.GetEx<int>();
        }
    }
}
