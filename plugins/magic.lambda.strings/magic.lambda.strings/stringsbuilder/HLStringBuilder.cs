/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Text;
using System.Threading.Tasks;
using magic.node;
using magic.signals.contracts;

namespace magic.lambda.strings.builder
{
    /// <summary>
    /// [strings.builder] slot, allowing you to construct a new StringBuilder.
    /// </summary>
    [Slot(Name = "strings.builder")]
    public class HLStringBuilder : ISlotAsync
    {
        /// <summary>
        /// Handles the signal for the class.
        /// </summary>
        /// <param name="signaler">Signaler used to signal the slot.</param>
        /// <param name="input">Root node for invocation.</param>
        /// <returns>An awaitable task.</returns>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            var builder = new StringBuilder();
            try
            {
                await signaler.ScopeAsync(
                    ".strings.builder",
                    builder,
                    async () => await signaler.SignalAsync("eval", input));
            }
            finally
            {
                input.Value = builder.ToString();
            }
        }
    }
}
