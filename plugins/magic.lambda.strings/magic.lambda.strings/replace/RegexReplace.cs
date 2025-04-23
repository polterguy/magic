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
    /// [strings.regex-replace] slot that will perform a substitution of the regular expression
    /// matches from [what] with [with] found in your source string. [what] is expected
    /// to be a valid regular expression.
    /// </summary>
    [Slot(Name = "strings.regex-replace")]
    public class RegexReplace : ISlotAsync
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
            await signaler.SignalAsync("eval", input);

            var original = input.GetEx<string>();
            var what = input.Children.First().GetEx<string>();
            var with = input.Children.Skip(1).First().GetEx<string>();

            // Substituting.
            input.Value = Regex.Replace(original, what, with, RegexOptions.Multiline);

            // House cleaning.
            input.Clear();
        }

        #region [ -- Private helper methods -- ]

        static void SanityCheck(Node input)
        {
            if (input.Children.Count() != 2)
                throw new HyperlambdaException("[strings.regex-replace] requires exactly two arguments, the first being a regular expression of what to look for, the other beings its substitute");
        }

        #endregion
    }
}
