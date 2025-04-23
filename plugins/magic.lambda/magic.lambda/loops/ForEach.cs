/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.loops
{
    /// <summary>
    /// [for-each] slot allowing you to iterate through a list of node, resulting from the evaluation of an expression.
    /// </summary>
    [Slot(Name = "for-each")]
    public class ForEach : ISlot
    {
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        /// <returns>An awaitable task.</returns>
        public void Signal(ISignaler signaler, Node input)
        {
            // Making sure we can reset back to original nodes after every single iteration.
            var old = input.Children.Select(x => x.Clone()).ToList();

            // Storing termination node, to check if we should terminate early for some reasons.
            var terminate = signaler.Peek<Node>("slots.result");

            foreach (var idx in input.Evaluate())
            {
                // Inserting "data pointer".
                input.Insert(0, new Node(".dp", idx));

                // Evaluating "body" lambda of [for-each]
                signaler.Signal("eval", input);

                // Resetting back to original nodes.
                input.Clear();

                // Notice, cloning in case we've got another iteration, to avoid changing original nodes' values.
                input.AddRange(old.Select(x => x.Clone()));

                // Checking if execution for some reasons was terminated.
                if (terminate != null && (terminate.Value != null || terminate.Children.Any()))
                    return;
            }
        }
    }
}
