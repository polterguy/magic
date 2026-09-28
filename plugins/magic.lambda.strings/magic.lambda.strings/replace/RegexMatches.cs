/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Threading.Tasks;
using System.Text.RegularExpressions;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.strings.replace
{
    /// <summary>
    /// [strings.matches] slot that will find all regular expression matches from specified string and
    /// return to caller.
    /// </summary>
    [Slot(
        Name = "strings.matches",
        Description = "Returns regular expression matches",
        ValueKind = "text",
        ValueDescription = "Text to match against the regular expression",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.Lambda,
        ReturnsKind = "regex-match-list,string-list",
        ReturnsElementKind = "regex-match,text",
        ReturnsDescription = "Returns one child node per regular expression match",
        SignatureType = typeof(global::magic.lambda.strings.signatures.RegexStringArgumentSignature))]
    public class RegexMatches : ISlotAsync
    {
        /// <summary>
        /// Implementation of slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise the signal.</param>
        /// <param name="input">Arguments to slot.</param>
        /// <returns>An awaitable task.</returns>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            // Sanity checking invocation and evaluating children nodes.
            SanityCheck(input);
            await signaler.SignalAsync("eval", input, skipWhitelist: true);

            // Retrieving arguments.
            var source = input.GetEx<string>();
            var regex = input.Children.First().GetEx<string>();

            // House cleaning.
            input.Clear();
            input.Value = null;

            // Retrieving matches.
            var ex = new Regex(regex);
            foreach (Match idx in ex.Matches(source))
            {
                input.Add(new Node(".", idx.Value));
            }
        }

        #region [ -- Private helper methods -- ]

        static void SanityCheck(Node input)
        {
            if (input.Children.Count() != 1)
                throw new HyperlambdaException("[strings.matches] requires exactly one argument being the regular expression to match towards specified source value");
        }

        #endregion
    }
}
