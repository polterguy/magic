/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Collections.Generic;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.source
{
    /// <summary>
    /// [get-first-value] slot that will return the first value found by evaluating its expression, and/or
    /// its children nodes.
    /// </summary>
    [Slot(Name = "get-first-value")]
    public class GetFirstValue : ISlot
    {
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        /// <returns>Awaitable task</returns>
        public void Signal(ISignaler signaler, Node input)
        {
            // Prioritising value of node.
            var result = TryValue(input);

            // Checking if above resulted in null at which point we try to evaluate children nodes.
            if (result == null)
            {
                var whitelist = signaler.Peek<List<Node>>("whitelist");
                foreach (var idx in input.Children)
                {
                    if (idx.Name.Length != 0 && idx.Name.FirstOrDefault() != '.')
                    {
                        if (whitelist != null && !whitelist.Any(x => x.Name == idx.Name))
                            throw new HyperlambdaException($"Slot [{idx.Name}] doesn't exist in currrent scope");
                        signaler.Signal(idx.Name, idx);
                    }

                    // Short curcuiting if we've got a value.
                    if (idx.Value != null)
                    {
                        result = idx.Value;
                        break;
                    }
                }
            }

            // Assigning result and doing some house cleaning.
            input.Clear();
            input.Value = result;
        }

        #region [ -- Private helper methods -- ]

        /*
         * Helper method to evaluate expressions in specified node, and return first result found
         * as result of evaluating expression, or null of no value found.
         */
        static object TryValue(Node input)
        {
            if (input.Value is Expression exp)
                return exp
                    .Evaluate(input)
                    .FirstOrDefault(x => x.Value != null)?
                    .Value ?? null;
            else
                return input.Value;
        }

        #endregion
    }
}
