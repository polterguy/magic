/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.eval
{
    /// <summary>
    /// [eval] slot, allowing you to dynamically evaluate a piece of lambda.
    /// </summary>
    [Slot(Name = "eval")]
    public class Eval : ISlotAsync
    {
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        /// <returns>An awaiatble task.</returns>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            // Storing termination node, to check if we should terminate early for some reasons.
            var terminate = signaler.Peek<Node>("slots.result");
            var whitelist = signaler.Peek<List<Node>>("whitelist");

            // Evaluating "scope".
            foreach (var idx in GetNodes(input))
            {
                // Verifying caller is allowed to invoke slot.
                if (whitelist != null && !whitelist.Any(x => x.Name == idx.Name))
                    throw new HyperlambdaException($"Slot [{idx.Name}] doesn't exist in currrent scope");

                // Invoking signal.
                await signaler.SignalAsync(idx.Name, idx);

                // Checking if execution for some reasons was terminated.
                if (terminate != null && (terminate.Value != null || terminate.Children.Any()))
                    return;
            }
        }

        #region [ -- Private helper methods -- ]

        /*
         * Helper to retrieve execution nodes for slot.
         */
        static IEnumerable<Node> GetNodes(Node input)
        {
            // Sanity checking invocation. Notice non [eval] keywords might have expressions and children.
            if (input.Value != null &&
                input.Children.Any() &&
                input.Name == "eval")
                throw new HyperlambdaException("[eval] cannot handle both expression values and children at the same time");

            // Children have precedence, in case invocation is from a non [eval] keyword.
            if (input.Children.Any())
                return input
                    .Children
                    .Where(x => x.Name != string.Empty && !x.Name.StartsWith("."));

            if (input.Value != null && 
                input.Name == "eval")
                return input
                    .Evaluate()
                    .SelectMany(x => 
                        x.Children
                            .Where(x2 => x2.Name != string.Empty && !x2.Name.StartsWith(".")));

            // Nothing to evaluate here.
            return Array.Empty<Node>();
        }

        #endregion
    }
}
