/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Collections.Generic;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.node.extensions.hyperlambda;

namespace magic.lambda.hyperlambda
{
    /// <summary>
    /// [hyperlambda.verify-slots] slot, verifying that every slot referenced at the
    /// root level of a piece of Hyperlambda, and inside its [.lambda] blocks, actually
    /// exists as a registered slot in the system.
    ///
    /// Intended as a cheap static sanity check on generated Hyperlambda: a hallucinated
    /// slot (e.g. a made up "strings.reverse") is silently treated as an inert data node
    /// by the evaluator, so this slot surfaces such names before the code is executed.
    ///
    /// SCOPE (deliberately limited for now): only slots in EXECUTABLE STATEMENT position
    /// are checked - the root level, and the statements inside [.lambda] blocks nested to
    /// any depth. Everything else is ignored: arguments to slots, conditions and operands,
    /// bodies that are not [.lambda] (e.g. [case]/[try] bodies), and every node whose name
    /// starts with a "." (variables, comments, [.arguments]).
    /// </summary>
    [Slot(
        Name = "hyperlambda.verify-slots",
        Description = "Verifies that all slots referenced at the root and inside [.lambda] blocks of the specified Hyperlambda exist",
        ValueKind = "hyperlambda",
        ValueDescription = "Hyperlambda text to verify; alternatively supply an already parsed lambda as children",
        ValueRequired = false,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.Both,
        ReturnsKind = "boolean",
        ReturnsElementKind = "text",
        ReturnsDescription = "Resolves to true when every referenced slot exists, and lists the names of any non-existing slots as child nodes")]
    public class VerifySlots : ISlot
    {
        readonly ISignalsProvider _signalProvider;

        /// <summary>
        /// Constructor requiring a signals provider to be able to look up which slots exist.
        /// </summary>
        /// <param name="signalProvider">Slot provider, providing all slots that exists in the system.</param>
        public VerifySlots(ISignalsProvider signalProvider)
        {
            _signalProvider = signalProvider;
        }

        /// <summary>
        /// Implementation of your slot.
        /// </summary>
        /// <param name="signaler">Signaler that raised the signal.</param>
        /// <param name="input">Arguments to your slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            // All registered slot names, for fast existence lookups.
            var slots = new HashSet<string>(_signalProvider.Keys, StringComparer.Ordinal);

            /*
             * The lambda to verify; parsed from a Hyperlambda string value when one is
             * supplied, otherwise the slot's own already parsed children are verified.
             */
            var hyperlambda = input.GetEx<string>();
            var lambda = string.IsNullOrEmpty(hyperlambda)
                ? input.Children.ToList()
                : HyperlambdaParser.Parse(hyperlambda).Children.ToList();

            // Walking root statements and [.lambda] blocks, collecting non-existing slot names.
            var missing = new List<string>();
            var seen = new HashSet<string>(StringComparer.Ordinal);
            VerifyScope(lambda, slots, missing, seen);

            // Returning true when every referenced slot exists, plus the missing names as child nodes.
            input.Clear();
            input.Value = missing.Count == 0;
            input.AddRange(missing.Select(x => new Node("", x)));
        }

        #region [ -- Private helper methods -- ]

        /*
         * Verifies one executable scope: iterates its statement nodes, checks each slot
         * invocation exists, and recurses into every [.lambda] block it declares.
         */
        static void VerifyScope(
            IEnumerable<Node> statements,
            HashSet<string> slots,
            List<string> missing,
            HashSet<string> seen)
        {
            foreach (var node in statements)
            {
                var name = node.Name;

                /*
                 * Nodes whose name starts with "." (variables, comments, [.arguments]) and
                 * anonymous nodes are NOT slot invocations - skipping them, but descending
                 * into [.lambda] blocks since those hold executable statements.
                 */
                if (name.Length == 0 || name[0] == '.')
                {
                    if (name == ".lambda")
                        VerifyScope(node.Children, slots, missing, seen);
                    continue;
                }

                // This is a slot invocation in statement position - verifying it exists.
                if (!slots.Contains(name) && seen.Add(name))
                    missing.Add(name);

                /*
                 * Descending into any [.lambda] blocks this slot declares (e.g. [if],
                 * [while], [for-each], [whitelist], ...), so nested statements are verified too.
                 */
                foreach (var child in node.Children)
                {
                    if (child.Name == ".lambda")
                        VerifyScope(child.Children, slots, missing, seen);
                }
            }
        }

        #endregion
    }
}
