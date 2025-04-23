/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Threading.Tasks;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.strings.concat
{
    /// <summary>
    /// [strings.concat] slot for concatenating two or more strings together to become one.
    /// </summary>
    [Slot(Name = "strings.concat")]
    public class Concat : ISlotAsync
    {
        /// <summary>
        /// Implementation of slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise the signal.</param>
        /// <param name="input">Arguments to slot.</param>
        /// <returns>An awaitable task.</returns>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            if (input.Children.Any())
            {
                await signaler.SignalAsync("eval", input);
                input.Value = string.Join("", input.Children.Select(x => x.GetEx<string>()));
            }
            else
            {
                var values = input.Evaluate();
                input.Value = string.Join("", values.Select(x => x.GetEx<string>()));
            }
            input.Clear();
        }
    }
}
