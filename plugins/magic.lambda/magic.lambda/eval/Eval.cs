/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Diagnostics;
using System.Globalization;
using System.Threading.Tasks;
using System.Collections.Generic;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.node.extensions.hyperlambda;

namespace magic.lambda.eval
{
    /// <summary>
    /// [eval] slot, allowing you to dynamically evaluate a piece of lambda.
    /// </summary>
    [Slot(
        Name = "eval",
        Description = "Executes a lambda block; use it to run a node tree dynamically or to scope a group of statements",
        ValueKind = "lambda-object,lambda-tree",
        ValueDescription = "Expression selecting the Hyperlambda nodes to evaluate",
        ValueRequired = true,
        ValueMode = SlotValueMode.Expression,
        ReturnsMode = SlotReturnsMode.None)]
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
            signaler.ThrowIfCancelled();

            // Storing termination node, to check if we should terminate early for some reasons.
            var terminate = signaler.Peek<Node>("slots.result");
            var whitelist = signaler.Peek<List<Node>>("whitelist");

            /*
             * Debug recorder, if any, retrieved once for the entire block instead of once per statement.
             * Null unless [system.debug] is currently executing this lambda, at which point every
             * invocation below is recorded together with the state of the entire lambda afterwards.
             *
             * Notice, the stack object is deliberately named with a leading dot, since that is the
             * convention for context objects Hyperlambda itself must not be able to reach.
             */
            var recording = signaler.Peek<Node>(".debug.recorder");

            // Evaluating "scope".
            foreach (var idx in GetNodes(input))
            {
                // Verifying caller is allowed to invoke slot.
                if (whitelist != null && !whitelist.Any(x => 
                {
                    if (x.Name == idx.Name)
                    {
                        if (x.Value != null && idx.Value != null && x.Get<string>() != idx.GetEx<string>())
                              return false;
                        return true;
                    }
                    return false;
                }))
                    throw new HyperlambdaException($"Slot [{idx.Name}] doesn't exist in currrent scope, or argument `{idx.GetEx<string>()}` not allowed");

                signaler.ThrowIfCancelled();

                // Invoking signal.
                if (recording == null)
                {
                    await signaler.SignalAsync(idx.Name, idx);
                }
                else
                {
                    /*
                     * Recording in a finally block, such that the statement that throws is the last
                     * one in the recording - which is the entire point of recording an execution
                     * that failed.
                     */
                    var timer = Stopwatch.StartNew();
                    try
                    {
                        await signaler.SignalAsync(idx.Name, idx);
                    }
                    finally
                    {
                        timer.Stop();
                        Record(recording, idx, timer.ElapsedMilliseconds);
                    }
                }

                signaler.ThrowIfCancelled();

                // Checking if execution for some reasons was terminated.
                if (terminate != null && (terminate.Value != null || terminate.Children.Any()))
                    return;
            }
        }

        #region [ -- Private helper methods -- ]

        /*
         * Maximum number of statements one recording will hold, preventing a runaway loop from
         * exhausting memory. The recording declares its own truncation rather than silently
         * stopping.
         */
        const int MAX_STEPS = 10000;

        /*
         * Appends one step to the recording, being the slot that was just invoked, and the state of
         * the entire lambda object afterwards, serialised as Hyperlambda.
         */
        static void Record(Node recording, Node executed, long elapsed)
        {
            // The recording counts itself through its own value, since counting children is O(n).
            var count = recording.Value == null ? 0 : (int)recording.Value;
            if (count > MAX_STEPS)
                return;
            recording.Value = count + 1;
            if (count == MAX_STEPS)
            {
                recording.Add(new Node(".", null, new Node[] { new Node("truncated", MAX_STEPS) }));
                return;
            }

            // Finding the root of the lambda being executed, which is the whole program under debug.
            var root = executed;
            while (root.Parent != null)
            {
                root = root.Parent;
            }

            var step = new Node(".");
            step.Add(new Node("slot", executed.Name));
            step.Add(new Node("path", GetPath(executed)));
            step.Add(new Node("elapsed", elapsed));
            step.Add(new Node("lambda", HyperlambdaGenerator.GetHyperlambda(root.Children)));
            recording.Add(step);
        }

        /*
         * Returns the position of the specified node within its lambda as a dot separated list of
         * indexes, allowing whatever renders the recording to highlight the executing node.
         */
        static string GetPath(Node node)
        {
            var path = new List<string>();
            var current = node;
            while (current.Parent != null)
            {
                var index = 0;
                foreach (var idxSibling in current.Parent.Children)
                {
                    if (ReferenceEquals(idxSibling, current))
                        break;
                    index += 1;
                }
                path.Insert(0, index.ToString(CultureInfo.InvariantCulture));
                current = current.Parent;
            }
            return string.Join(".", path);
        }

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
