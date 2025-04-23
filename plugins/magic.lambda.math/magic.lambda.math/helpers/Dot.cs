/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Threading.Tasks;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.math
{
    /// <summary>
    /// [math.dot] slot for performing additions.
    /// </summary>
    [Slot(Name = "math.dot")]
    public class Dot : ISlotAsync
    {
        /// <summary>
        /// Implementation of slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise the signal.</param>
        /// <param name="input">Arguments to slot.</param>
        /// <returns>An awaitable task.</returns>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            // Sanity checking invocation.
            if (input.Children.Count() != 2)
                throw new HyperlambdaException("[math.dot] requires exactly two children nodes");

            await signaler.SignalAsync("eval", input);

            // Calculating dot product.
            var lhs = input.Children.First().Children.Select(x => x.GetEx<double>());
            var rhs = input.Children.Skip(1).First().Children.Select(x => x.GetEx<double>());
            var dot = lhs.Zip(rhs, (d1, d2) => d1 * d2).Sum();

            // Returning result to caller.
            input.Clear();
            input.Value = dot;
        }
    }
}
