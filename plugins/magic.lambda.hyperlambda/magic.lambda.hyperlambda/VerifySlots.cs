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
    /// [hyperlambda.verify-slots] slot, verifying that every slot referenced in EXECUTABLE
    /// STATEMENT position of a piece of Hyperlambda actually exists as a registered slot.
    ///
    /// Intended as a cheap static sanity check on generated Hyperlambda: a hallucinated
    /// slot (e.g. a made up "strings.reverse") is silently treated as an inert data node
    /// by the evaluator, so this slot surfaces such names before the code is executed.
    ///
    /// SCOPE - the executable statements that are checked are the ROOT level of the supplied
    /// Hyperlambda plus the body of every body-bearing slot it encounters, resolved from slot
    /// SIGNATURE metadata rather than hardcoded names. A slot declares an executable body
    /// through a [SlotChild] whose Mode is ExecutableLambda, and its Name says WHERE the body
    /// lives:
    ///   - Name "*"       -> the body is the slot's OWN direct children ([for-each], [map],
    ///                       [filter], [include], [data.connect], [if]/[while] condition,
    ///                       [and]/[or], [sort], [add], [set-value], ...).
    ///   - any other Name -> the body lives inside the child(ren) with that name: the wrapper
    ///                       ([.lambda] for [if]/[while]/[context]/[whitelist]), a named branch
    ///                       ([default] for [switch]), a fork ([fork] for [join]), or a callback
    ///                       ([.sse] for streaming [http.*]). "[.lambda]" is always treated as a
    ///                       wrapper, so slots without signature metadata still work by convention.
    /// Named non-executable arguments the signature also declares (e.g. [data.connect]'s
    /// [database-type]) are excluded from a "*" body. Both body kinds are traversed to any depth.
    ///
    /// STILL IGNORED (for now): non-executable arguments (e.g. [table]/[where] under
    /// [data.read]), [switch]'s [case] branches (a value child carrying a NESTED body, not an
    /// ExecutableLambda child), and every node whose name starts with a "." that is not a
    /// declared body (variables, comments, [.arguments]). Note that [add]/[insert-*] source
    /// bodies ARE checked - those slots [eval] their children, so a named child is a slot
    /// invocation at runtime while "." children are static data.
    /// </summary>
    [Slot(
        Name = "hyperlambda.verify-slots",
        Description = "Verifies that all slots referenced in executable statement position of the specified Hyperlambda exist",
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

            /*
             * Walking every executable statement, collecting non-existing slot names. The
             * cache memoizes each slot's body layout so signatures are reflected over once each.
             */
            var missing = new List<string>();
            var seen = new HashSet<string>(StringComparer.Ordinal);
            var cache = new Dictionary<string, BodyInfo>(StringComparer.Ordinal);
            VerifyScope(lambda, slots, cache, missing, seen);

            // Returning true when every referenced slot exists, plus the missing names as child nodes.
            input.Clear();
            input.Value = missing.Count == 0;
            input.AddRange(missing.Select(x => new Node("", x)));
        }

        #region [ -- Private helper methods -- ]

        /*
         * Verifies one executable scope: iterates its statement nodes, checks each slot
         * invocation exists, and recurses into every body the slot declares.
         */
        void VerifyScope(
            IEnumerable<Node> statements,
            HashSet<string> slots,
            Dictionary<string, BodyInfo> cache,
            List<string> missing,
            HashSet<string> seen)
        {
            foreach (var node in statements)
            {
                var name = node.Name;

                /*
                 * Nodes whose name starts with "." (variables, comments, [.arguments]) and
                 * anonymous nodes are NOT slot invocations - skipping them, but descending
                 * into a bare [.lambda] block since those hold executable statements.
                 */
                if (name.Length == 0 || name[0] == '.')
                {
                    if (name == ".lambda")
                        VerifyScope(node.Children, slots, cache, missing, seen);
                    continue;
                }

                // This is a slot invocation in statement position - verifying it exists.
                if (!slots.Contains(name) && seen.Add(name))
                    missing.Add(name);

                /*
                 * Descending into the slot's executable body/bodies. Every direct child is
                 * routed by the slot's signature: a named wrapper ([.lambda], [default],
                 * [fork], [.sse]) is descended into (its children are the statements), while a
                 * "*" body means the child itself is a statement. Named non-executable
                 * arguments are skipped.
                 */
                var info = BodyInfoFor(name, cache);
                foreach (var child in node.Children)
                {
                    if (info.WrapperNames.Contains(child.Name))
                        VerifyScope(child.Children, slots, cache, missing, seen);
                    else if (info.HasStarBody && !info.ArgumentNames.Contains(child.Name))
                        VerifyScope(new[] { child }, slots, cache, missing, seen);
                }
            }
        }

        /*
         * Body layout of a slot, derived from its signature:
         *   - HasStarBody   : the slot declares a "*" ExecutableLambda child, so its own direct
         *                     children are executable statements.
         *   - WrapperNames  : names of NAMED ExecutableLambda children whose OWN children are the
         *                     body ([.lambda], [default], [fork], [.sse]); "[.lambda]" is always
         *                     present so signature-less slots work by convention.
         *   - ArgumentNames : named non-executable children to exclude from a "*" body.
         */
        sealed class BodyInfo
        {
            public bool HasStarBody;
            public HashSet<string> WrapperNames = new HashSet<string>(StringComparer.Ordinal) { ".lambda" };
            public HashSet<string> ArgumentNames = new HashSet<string>(StringComparer.Ordinal);
        }

        /*
         * Resolves (and memoizes) the body layout of the specified slot from its signature.
         */
        BodyInfo BodyInfoFor(string name, Dictionary<string, BodyInfo> memo)
        {
            if (memo.TryGetValue(name, out var cached))
                return cached;
            var result = ComputeBodyInfo(name);
            memo[name] = result;
            return result;
        }

        BodyInfo ComputeBodyInfo(string name)
        {
            var result = new BodyInfo();
            var type = _signalProvider.GetSlot(name);
            if (type == null)
                return result;
            var attribute = type
                .GetCustomAttributes(typeof(SlotAttribute), false)
                .Cast<SlotAttribute>()
                .FirstOrDefault(x => x.Name == name);
            if (attribute?.SignatureType == null)
                return result;
            try
            {
                var children = (Activator.CreateInstance(attribute.SignatureType) as ISlotSignature)?.Children;
                if (children == null)
                    return result;
                foreach (var child in children)
                {
                    if (string.IsNullOrEmpty(child.Name))
                        continue;

                    /*
                     * Note that SourceContainer bodies ([add]/[insert-before]/[insert-after]/
                     * [include]) are deliberately included here: their implementations raise
                     * [eval] on their children, so a NAMED child is dispatched as a slot at
                     * runtime (and throws if it does not exist), while "."-prefixed children
                     * are static data - exactly the dispatch rule this walker applies.
                     */
                    if (child.Mode == SlotChildMode.ExecutableLambda)
                    {
                        if (child.Name == "*")
                            result.HasStarBody = true;
                        else
                            result.WrapperNames.Add(child.Name);
                    }
                    else if (child.Name != "*")
                    {
                        result.ArgumentNames.Add(child.Name);
                    }
                }
            }
            catch
            {
                // A signature that cannot be instantiated tells us nothing - leaving the defaults.
            }
            return result;
        }

        #endregion
    }
}
