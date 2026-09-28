/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Threading.Tasks;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.strings.replace
{
    /// <summary>
    /// [strings.trim]/[strings.trim-start]/[strings.trim-end] slot for trimming a specified string,
    /// optionally passing in a string that defines which characters to trim away.
    /// </summary>
    [Slot(
        Name = "strings.trim",
        Description = "Trims characters from both ends of the specified string",
        ValueKind = "text",
        ValueDescription = "Text to trim",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "text",
        ReturnsDescription = "Resolves to the trimmed string",
        SignatureType = typeof(global::magic.lambda.strings.signatures.TrimSignature))]
    [Slot(
        Name = "strings.trim-start",
        Description = "Trims characters from the start of the specified string",
        ValueKind = "text",
        ValueDescription = "Text to trim",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "text",
        ReturnsDescription = "Resolves to the string with leading characters removed",
        SignatureType = typeof(global::magic.lambda.strings.signatures.TrimSignature))]
    [Slot(
        Name = "strings.trim-end",
        Description = "Trims characters from the end of the specified string",
        ValueKind = "text",
        ValueDescription = "Text to trim",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "text",
        ReturnsDescription = "Resolves to the string with trailing characters removed",
        SignatureType = typeof(global::magic.lambda.strings.signatures.TrimSignature))]
    public class Trim : ISlotAsync
    {
        /// <summary>
        /// Implementation of slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise signal.</param>
        /// <param name="input">Arguments to your slot.</param>
        /// <returns>Awaitable task</returns>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            SanityCheck(input);
            await signaler.SignalAsync("eval", input, skipWhitelist: true);
            TrimImplementation(input);
            input.Clear(); // House cleaning.
        }

        #region [ -- Private helper methods -- ]

        static void SanityCheck(Node input)
        {
            if (input.Children.Count() > 1)
                throw new HyperlambdaException("[strings.trim] can handle at most one argument");
        }

        static void TrimImplementation(Node input)
        {
            var original = input.GetEx<string>();
            var what = input.Children.FirstOrDefault()?.GetEx<string>();
            switch(input.Name)
            {
                case "strings.trim-start":
                    if (string.IsNullOrEmpty(what))
                        input.Value = original.TrimStart();
                    else
                        input.Value = original.TrimStart(what.ToCharArray());
                    break;

                case "strings.trim-end":
                    if (string.IsNullOrEmpty(what))
                        input.Value = original.TrimEnd();
                    else
                        input.Value = original.TrimEnd(what.ToCharArray());
                    break;

                default:
                    if (string.IsNullOrEmpty(what))
                        input.Value = original.Trim();
                    else
                        input.Value = original.Trim(what.ToCharArray());
                    break;
            }
        }

        #endregion
    }
}
