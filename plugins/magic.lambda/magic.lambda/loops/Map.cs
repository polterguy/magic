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
    /// [map] slot allowing you to map a list of nodes into a new list, resulting from the evaluation of an expression.
    /// </summary>
    [Slot(
        Name = "map",
        Description = "Maps selected nodes into a new result set using the child lambda",
        ValueKind = "node-list",
        ValueDescription = "Expression selecting the nodes to map",
        ValueRequired = true,
        ValueMode = SlotValueMode.Expression,
        ReturnsMode = SlotReturnsMode.Lambda,
        ReturnsKind = "node-list",
        ReturnsDescription = "Resolves to one mapped output item per selected node, using the value or nodes returned by the child lambda",
        ProvidesIterationPointer = true,
        ScopeRequiresStrictExit = true,
        SignatureType = typeof(global::magic.lambda.signatures.MapSignature))]
    public class Map : ISlot
    {
        /// <summary>
        /// Implementation of signal.
        /// </summary>
        /// <param name="signaler">Signaler used to signal.</param>
        /// <param name="input">Parameters passed from signaler.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var mapped = new List<Node>();

            // Iterating through each source node.
            foreach (var idxSource in input.Evaluate().ToList())
            {
                // Making sure we can reset back to original nodes after every single iteration.
                var old = input.Children.Select(x => x.Clone()).ToList();

                // Making sure we're able to handle returned values and nodes from slot implementation.
                var result = new Node();
                signaler.Scope("slots.result", result, () =>
                {
                    input.Insert(0, new Node(".dp", idxSource));

                    // Evaluating mapper lambda.
                    signaler.Signal("eval", input, skipWhitelist: true);

                    // Resetting back to original nodes.
                    input.Clear();
                    input.AddRange(old.Select(x => x.Clone()));
                });

                AppendMappedResult(mapped, result);
            }

            // Replacing input with mapped result.
            input.Value = null;
            input.Clear();
            input.AddRange(mapped);
        }

        static void AppendMappedResult(List<Node> mapped, Node result)
        {
            if (result.Value == null && !result.Children.Any())
                throw new HyperlambdaException("[map] requires [return] to produce a value or nodes");

            if (result.Value != null)
                mapped.Add(new Node(".", result.Value));

            if (result.Children.Any())
                mapped.AddRange(result.Children.Select(x => x.Clone()));
        }
    }
}
