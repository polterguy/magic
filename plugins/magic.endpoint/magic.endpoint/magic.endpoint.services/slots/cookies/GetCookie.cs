/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.endpoint.contracts.poco;

namespace magic.endpoint.services.slots.cookies
{
    /// <summary>
    /// [request.cookies.get] slot for retrieving value of a cookie passed in through the request.
    /// </summary>
    [Slot(
        Name = "request.cookies.get",
        Description = "Returns a request cookie by name",
        ValueKind = "cookie-name",
        ValueDescription = "Cookie name to retrieve",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "cookie-value,text",
        ReturnsDescription = "Resolves to the value of the named request cookie, or null if it does not exist")]
    public class GetCookie : ISlot
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
            if (request.Cookies.TryGetValue(key, out string value))
                input.Value = value;
            else
                input.Value = null;
        }
    }
}
