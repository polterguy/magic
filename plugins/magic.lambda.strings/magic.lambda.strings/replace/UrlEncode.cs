/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Net;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.strings.replace
{
    /// <summary>
    /// [strings.url-encode] slot that URL encodes the specified string.
    /// </summary>
    [Slot(
        Name = "strings.url-encode",
        Description = "URL encodes the specified string",
        ValueKind = "url-component,text",
        ValueDescription = "Text to encode",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "url-encoded,text",
        ReturnsDescription = "Resolves to the URL-encoded string",
        SignatureType = typeof(global::magic.signals.contracts.NoChildrenSignature))]
    public class UrlEncode : ISlot
    {
        /// <summary>
        /// Implementation of slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise signal.</param>
        /// <param name="input">Arguments to your slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            input.Value = WebUtility.UrlEncode(input.GetEx<string>());
        }
    }
}
