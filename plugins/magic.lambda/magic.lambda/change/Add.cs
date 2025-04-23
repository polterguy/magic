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
    /// [add] slot allowing you to append nodes into some destination node.
    /// </summary>
    [Slot(Name = "add")]
    public class Add : ISlot
    {
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        /// <returns>An awaitable task.</returns>
        public void Signal(ISignaler signaler, Node input)
        {
            signaler.Signal("eval", input);
            AddResult(input);
            input.Clear();
        }

        #region [ -- Private helper methods -- ]

        /*
         * Adds result from source into destination nodes.
         */
        static void AddResult(Node input)
        {
            // Iterating through each destination.
            foreach (var idxDest in input.Evaluate().ToList())
            {
                idxDest.AddRange(input.Children.SelectMany(x => x.Children).Select(x2 => x2.Clone()));
            }
        }

        #endregion
    }
}
