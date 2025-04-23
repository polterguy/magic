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
    /// [strings.split] slot for splitting one string into multiple
    /// strings according to some string.
    /// </summary>
    [Slot(Name = "strings.split")]
    public class Split : ISlotAsync
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

            // Figuring out which string to split, and upon what to split.
            var split = input.GetEx<string>();
            var splitOn = input.Children.Where(x => x.Name == ".").Select(x => x.GetEx<string>()).ToArray<string>();

            input.Clear();
            input.AddRange(split
                .Split(splitOn, StringSplitOptions.RemoveEmptyEntries)
                .Select(x => new Node("", x)));
        }

        #region [ -- Private helper methods -- ]

        static void SanityCheck(Node input)
        {
            if (!input.Children.Any())
                throw new HyperlambdaException("No arguments provided to [strings.split]");
        }

        #endregion
    }
}
