/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Text;
using System.Threading.Tasks;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.strings.replace
{
    /// <summary>
    /// [strings.replace-not-of] slot for replacing occurrencies of any single character not matching
    /// the specified character with some substitute character.
    /// </summary>
    [Slot(
        Name = "strings.replace-not-of",
        Description = "Replaces characters not found in the supplied allow-list",
        ValueKind = "text",
        ValueDescription = "Text to transform",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "text",
        ReturnsDescription = "Resolves to the string after replacing characters not found in the allowed set",
        SignatureType = typeof(global::magic.lambda.strings.signatures.ReplaceNotOfSignature))]
    public class ReplaceNotOf : ISlotAsync
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
            ReplaceImplementation(input);
        }

        #region [ -- Private helper methods -- ]

        static void SanityCheck(Node input)
        {
            if (input.Children.Count() != 2)
                throw new HyperlambdaException("[strings.replace-not-of] requires exactly two arguments, the first being a list of characters to not replace, the other beings its replacement character(s)");
        }

        static void ReplaceImplementation(Node input)
        {
            var original = input.GetEx<string>();
            var what = input.Children.First().GetEx<string>();
            var with = input.Children.Skip(1).First().GetEx<string>();

            // Substituting.
            var result = new StringBuilder();
            foreach (var idx in original)
            {
                if (what.IndexOf(idx) != -1)
                    result.Append(idx);
                else
                    result.Append(with);
            }
            input.Value = result.ToString();
        }

        #endregion
    }
}
