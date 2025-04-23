/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Threading.Tasks;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.strings.misc
{
    /// <summary>
    /// [strings.ends-with] slot that returns true if the specified string ends with its value
    /// from its first argument.
    /// </summary>
    [Slot(Name = "strings.ends-with")]
    public class EndsWith : ISlotAsync
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
            input.Value = input.GetEx<string>()?
                .EndsWith(input.Children.First().GetEx<string>(), StringComparison.InvariantCulture) ?? false;
            input.Clear(); // House cleaning.
        }

        #region [ -- Private helper methods -- ]

        static void SanityCheck(Node input)
        {
            if (input.Children.Count() != 1)
                throw new HyperlambdaException("[strings.ends-with] must be given exactly one argument that contains value to look for");
        }

        #endregion
    }
}
