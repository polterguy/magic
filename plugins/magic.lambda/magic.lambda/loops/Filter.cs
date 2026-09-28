/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Collections.Generic;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.loops
{
    /// <summary>
    /// [filter] slot allowing you to filter a list of nodes, resulting from the evaluation of an expression.
    /// </summary>
    [Slot(
        Name = "filter",
        Description = "Filters selected nodes using the child lambda as a predicate",
        ValueKind = "node-list",
        ValueDescription = "Expression selecting the nodes to filter",
        ValueRequired = true,
        ValueMode = SlotValueMode.Expression,
        ReturnsMode = SlotReturnsMode.Lambda,
        ReturnsKind = "node-list",
        ReturnsDescription = "Resolves to clones of the selected nodes whose predicate body returns true",
        PreservesInputShape = true,
        ProvidesIterationPointer = true,
        ScopeRequiresStrictExit = true,
        SignatureType = typeof(global::magic.lambda.signatures.FilterSignature))]
    public class Filter : ISlot
    {
        /// <summary>
        /// Implementation of signal.
        /// </summary>
        /// <param name="signaler">Signaler used to signal.</param>
        /// <param name="input">Parameters passed from signaler.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var filtered = new List<Node>();

            // Iterating through each source node.
            foreach (var idxSource in input.Evaluate().ToList())
            {
                // Making sure we can reset back to original nodes after every single iteration.
                var old = input.Children.Select(x => x.Clone()).ToList();

                // Making sure we're able to handle returned values and nodes from slot implementation.
                var result = new Node();
                var keep = false;
                signaler.Scope("slots.result", result, () =>
                {
                    input.Insert(0, new Node(".dp", idxSource));

                    // Evaluating predicate.
                    signaler.Signal("eval", input, skipWhitelist: true);

                    // Determining whether current node should be kept.
                    keep = result.GetEx<bool>();

                    // Resetting back to original nodes.
                    input.Clear();
                    input.AddRange(old.Select(x => x.Clone()));
                });

                if (keep)
                    filtered.Add(idxSource.Clone());
            }

            // Replacing input with filtered result.
            input.Value = null;
            input.Clear();
            input.AddRange(filtered);
        }
    }
}
