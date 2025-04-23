/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.change
{
    /// <summary>
    /// [include] slot combining [eval], [for-each], and [add] to dynamically include nodes into each node resulting from expression.
    /// </summary>
    [Slot(Name = "include")]
    public class Include : ISlot
    {
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        /// <returns>An awaitable task.</returns>
        public void Signal(ISignaler signaler, Node input)
        {
            // Iterating through each destination.
            foreach (var idxDest in input.Evaluate().ToList())
            {
                // Making sure we can reset back to original nodes after every single iteration.
                var old = input.Children.Select(x => x.Clone()).ToList();

                // Making sure we're able to handle returned values and nodes from slot implementation.
                var result = new Node();
                signaler.Scope("slots.result", result, () =>
                {
                    input.Insert(0, new Node(".dp", idxDest));

                    // Evaluating lambda of slot.
                    signaler.Signal("eval", input);

                    // Resetting back to original nodes.
                    input.Clear();

                    // Notice, cloning in case we've got another iteration, to avoid changing original nodes' values.
                    input.AddRange(old.Select(x => x.Clone()));
                });

                // Applying result.
                idxDest.AddRange(result.Children);
            }
            input.Clear();
        }
    }
}
