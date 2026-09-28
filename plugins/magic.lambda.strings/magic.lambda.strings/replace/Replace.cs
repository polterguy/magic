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
    /// [strings.replace] slot for replacing occurrencies of one string with another string. Pass in [what]
    /// being what to replace and [with] being its new value.
    /// </summary>
    [Slot(
        Name = "strings.replace",
        Description = "Returns the text with every occurrence of [what] swapped for [with]; pass an empty [with] to strip matches",
        ValueKind = "text",
        ValueDescription = "Text to transform",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "text",
        ReturnsDescription = "Resolves to the string after replacing the specified substring",
        SignatureType = typeof(global::magic.lambda.strings.signatures.ReplaceSignature))]
    public class Replace : ISlotAsync
    {
        /// <summary>
        /// Implementation of slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise the signal.</param>
        /// <param name="input">Arguments to slot.</param>
        /// <returns>An awaitable task.</returns>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            SanityCheck(input);
            await signaler.SignalAsync("eval", input, skipWhitelist: true);

            var original = input.GetEx<string>();
            var what = input.Children.First().GetEx<string>();
            var with = input.Children.Skip(1).FirstOrDefault()?.GetEx<string>() ?? "";

            // Substituting.
            input.Value = original.Replace(what, with);
        }

        #region [ -- Private helper methods -- ]

        static void SanityCheck(Node input)
        {
            var count = input.Children.Count();
            if (count != 1 && count != 2)
                throw new HyperlambdaException("[strings.replace] requires one or two arguments, the first being what to replace, the other optional argument being what to replace it with");
        }

        #endregion
    }
}
