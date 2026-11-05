/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Web;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.html.slots
{
    /// <summary>
    /// [html-decode] slot to decode HTML encoded content
    /// </summary>
    [Slot(
        Name = "html-decode",
        Description = "HTML decodes the specified string",
        ValueKind = "html-encoded",
        ValueDescription = "HTML encoded text to decode",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "html,text",
        ReturnsDescription = "Resolves to the decoded text")]
    public class HtmlDecode : ISlot
    {
        /// <summary>
        /// Slot implementation.
        /// </summary>
        /// <param name="signaler">Signaler that raised signal.</param>
        /// <param name="input">Arguments to slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            input.Value = HttpUtility.HtmlDecode(input.GetEx<string>());
        }
    }
}
