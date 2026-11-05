/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Linq;
using System.Globalization;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.change
{
    /// <summary>
    /// [format] slot allowing you to format some value according to some pattern.
    /// </summary>
    [Slot(
        Name = "format",
        Description = "Formats a value using a .NET format string and optional culture; useful for currencies, dates, and number rendering",
        ValueKind = "scalar",
        ValueDescription = "Value to format",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "text",
        ReturnsDescription = "Resolves to the formatted string",
        SignatureType = typeof(global::magic.lambda.signatures.FormatSignature))]
    public class Format : ISlot
    {
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var value = input.GetEx<object>();
            var pattern = input.Children.First(x => x.Name == "pattern").GetEx<string>();
            var culture = CultureInfo.InvariantCulture;
            var cultureNode = input.Children.FirstOrDefault(x => x.Name == "culture");
            if (cultureNode != null)
                culture = new CultureInfo(cultureNode.GetEx<string>());
            input.Clear();
            input.Value = string.Format(culture, pattern, value);
        }
    }
}
