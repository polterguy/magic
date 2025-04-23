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
    /// [strings.join] slot for joining two or more strings with
    /// a separator character in between each string joined.
    /// </summary>
    [Slot(Name = "strings.join")]
    public class Join : ISlotAsync
    {
        /// <summary>
        /// Implementation of slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise the signal.</param>
        /// <param name="input">Arguments to slot.</param>
        /// <returns>An awaitable task.</returns>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            await signaler.SignalAsync("eval", input);
            input.Value = string.Join(
                input.Children.FirstOrDefault()?.GetEx<string>() ?? "",
                input.Evaluate().Select(x => x.GetEx<string>()).ToArray());

            // House cleaning.
            input.Clear();
        }
    }
}
