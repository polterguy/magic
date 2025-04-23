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
    /// [sort] slot allowing you to sort a list of nodes.
    /// </summary>
    [Slot(Name = "sort")]
    public class Sort : ISlot
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

            // Sorting nodes.
            var list = input.Evaluate().Select(x => x.Clone()).ToList();
            list.Sort((lhs, rhs) =>
            {
                // Inserting "data pointers".
                var result = new Node(".result");
                input.Insert(0, result);
                input.Insert(1, new Node(".lhs", lhs));
                input.Insert(2, new Node(".rhs", rhs));

                // Evaluating "body" lambda of [for-each]
                signaler.Signal("eval", input);

                // Resetting back to original nodes.
                input.Clear();

                // Notice, cloning in case we've got another iteration, to avoid changing original nodes' values.
                input.AddRange(old.Select(x => x.Clone()));

                // Returning result of invocation to caller.
                return result.GetEx<int>();
            });

            // House cleaning.
            input.Value = null;
            input.Clear();

            // Returning result to caller.
            input.AddRange(list);
        }
    }
}
