/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.change
{
    /// <summary>
    /// [sort] slot allowing you to sort a list of nodes.
    /// </summary>
    [Slot(
        Name = "sort",
        Description = "Sorts selected nodes using the child lambda as a comparer",
        ValueKind = "node-list",
        ValueDescription = "Expression selecting the nodes to sort",
        ValueRequired = true,
        ValueMode = SlotValueMode.Expression,
        ReturnsMode = SlotReturnsMode.Lambda,
        ReturnsKind = "node-list",
        ReturnsDescription = "Resolves to the sorted nodes selected by the expression as child nodes",
        PreservesInputShape = true,
        SignatureType = typeof(global::magic.lambda.signatures.SortSignature))]
    public class Sort : ISlotAsync
    {
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        /// <returns>An awaitable task.</returns>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            // Making sure we can reset back to original nodes after every single iteration.
            var old = input.Children.Select(x => x.Clone()).ToList();

            // Sorting nodes.
            var list = input.Evaluate().Select(x => x.Clone()).ToList();
            list = await MergeSortAsync(list, async (lhs, rhs) =>
            {
                // Inserting "data pointers".
                var result = new Node(".result");
                input.Insert(0, result);
                input.Insert(1, new Node(".lhs", lhs));
                input.Insert(2, new Node(".rhs", rhs));

                // Evaluating "body" lambda of [for-each]
                await signaler.SignalAsync("eval", input, skipWhitelist: true);

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

        #region [ -- Private helper methods -- ]

        /*
         * Stable merge sort, since List.Sort needs a synchronous comparer and the comparer here is a lambda evaluated asynchronously.
         */
        static async Task<List<Node>> MergeSortAsync(List<Node> items, Func<Node, Node, Task<int>> compare)
        {
            if (items.Count < 2)
                return items;

            var middle = items.Count / 2;
            var left = await MergeSortAsync(items.GetRange(0, middle), compare);
            var right = await MergeSortAsync(items.GetRange(middle, items.Count - middle), compare);

            var result = new List<Node>(items.Count);
            int l = 0, r = 0;
            while (l < left.Count && r < right.Count)
                result.Add(await compare(left[l], right[r]) <= 0 ? left[l++] : right[r++]);

            result.AddRange(left.GetRange(l, left.Count - l));
            result.AddRange(right.GetRange(r, right.Count - r));
            return result;
        }

        #endregion
    }
}
