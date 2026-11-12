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
    /// [strings.url-decode] slot that URL decodes the specified string.
    /// </summary>
    [Slot(
        Name = "strings.url-decode",
        Description = "URL decodes the specified string",
        ValueKind = "url-encoded",
        ValueDescription = "Text to decode",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "url-component,text",
        ReturnsDescription = "Resolves to the URL-decoded string",
        SignatureType = typeof(global::magic.signals.contracts.NoChildrenSignature))]
    public class UrlDecode : ISlot
    {
        /// <summary>
        /// Implementation of slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise signal.</param>
        /// <param name="input">Arguments to your slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            input.Value = WebUtility.UrlDecode(input.GetEx<string>());
        }
    }
}
