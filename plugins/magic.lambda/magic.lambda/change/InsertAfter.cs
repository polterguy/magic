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
    /// [insert-after] slot allowing you to insert a range of nodes after some other node
    /// in your lambda graph object.
    /// </summary>
    [Slot(
        Name = "insert-after",
        Description = "Inserts nodes after the specified target node",
        ValueKind = "node-list,single-object",
        ValueDescription = "Expression selecting the target node or nodes to insert after",
        ValueRequired = true,
        ValueMode = SlotValueMode.Expression,
        ReturnsMode = SlotReturnsMode.None,
        SignatureType = typeof(global::magic.lambda.signatures.SourceContainerSignature))]
    public class InsertAfter : ISlot
    {
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        /// <returns>An awaitable task.</returns>
        public void Signal(ISignaler signaler, Node input)
        {
            signaler.Signal("eval", input, skipWhitelist: true);
            Insert(input);
            input.Clear();
        }

        #region [ -- Private helper methods -- ]

        static void Insert(Node input)
        {
            // Looping through each destination.
            foreach (var idxDest in input.Evaluate().ToList()) // To avoid changing collection during enumeration
            {
                /*
                 * Looping through each source node and adding its children to currently iterated destination.
                 * 
                 * Notice, Reverse() to make sure ordering becomes what caller expects.
                 */
                foreach (var idxSource in input.Children.SelectMany(x => x.Children).Reverse())
                {
                    idxDest.InsertAfter(idxSource.Clone()); // Cloning in case of multiple destinations.
                }
            }
        }

        #endregion
    }
}
