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
    /// [strings.html-decode] slot that HTML decodes the specified string.
    /// </summary>
    [Slot(
        Name = "strings.html-decode",
        Description = "HTML decodes the specified string",
        ValueKind = "html-encoded",
        ValueDescription = "HTML encoded text to decode",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "html-unencoded,text",
        ReturnsDescription = "Resolves to the decoded HTML markup",
        SignatureType = typeof(global::magic.signals.contracts.NoChildrenSignature))]
    public class HtmlDecode : ISlot
    {
        /// <summary>
        /// Implementation of slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise signal.</param>
        /// <param name="input">Arguments to your slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            input.Value = WebUtility.HtmlDecode(input.GetEx<string>());
        }
    }
}
