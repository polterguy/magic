/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Threading.Tasks;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.strings.misc
{
    /// <summary>
    /// [strings.contains] slot that will return true if your specified string contains the value
    /// found from its first argument.
    /// </summary>
    [Slot(Name = "strings.contains")]
    public class Contains : ISlotAsync
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
            input.Value = input.GetEx<string>()?.Contains(input.Children.First().GetEx<string>()) ?? false;
            input.Clear(); // House cleaning.
        }

        #region [ -- Private helper methods -- ]

        static void SanityCheck(Node input)
        {
            if (input.Children.Count() != 1)
                throw new HyperlambdaException("[strings.contains] must be given exactly one argument that contains value to look for");
        }

        #endregion
    }
}
