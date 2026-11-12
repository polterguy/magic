/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
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
    /// [hyperlambda.verify-slots] slot, verifying slot invocations in EXECUTABLE STATEMENT
    /// position of a piece of Hyperlambda against their registered slot metadata.
    ///
    /// Intended as a cheap static sanity check on generated Hyperlambda: a hallucinated
    /// slot (e.g. a made up "strings.reverse") is silently treated as an inert data node
    /// by the evaluator, so this slot surfaces such names before the code is executed.
    /// It also rejects undeclared child argument names, missing mandatory primary values, and
    /// primary values given to slots whose metadata declares no value (ValueMode None).
    ///
    /// SCOPE - the executable statements that are checked are the ROOT level of the supplied
    /// Hyperlambda plus the body of every body-bearing slot it encounters, resolved from slot
    /// SIGNATURE metadata rather than hardcoded names. A slot declares an executable body
    /// through a [SlotChild] whose Mode is ExecutableLambda, and its Name says WHERE the body
    /// lives:
    ///   - Name "*"       -> the body is the slot's OWN direct children ([for-each], [map],
    ///                       [filter], [include], [data.connect], [if]/[while] condition,
    ///                       [and]/[or], [sort], [add], [set-value], ...).
    ///   - Name "."       -> with Mode ExecutableLambda, a positional argument the slot evaluates,
    ///                       counted as a "*" body ([strings.concat], [strings.replace], [mime.add], ...).
    ///   - any other Name -> the body lives inside the child(ren) with that name: the wrapper
    ///                       ([.lambda] for [if]/[while]/[context]/[whitelist]), a named branch
    ///                       ([default] for [switch]), a fork ([fork] for [join]), or a callback
    ///                       ([.sse] for streaming [http.*]). "[.lambda]" is always treated as a
    ///                       wrapper, so slots without signature metadata still work by convention.
    /// A named non-executable child can also carry a NESTED "*" body, as [case] does under
    /// [switch]; its children are executable statements even though its own value is an argument.
    /// Named non-executable arguments the signature also declares (e.g. [data.connect]'s
    /// [database-type]) are excluded from a "*" body. Executable continuation siblings declared
    /// through NextSiblingMustBeOneOf ([.catch]/[.finally] after [try]) are traversed as bodies,
    /// not checked as slots themselves. All body kinds are traversed to any depth.
    ///
    /// Non-executable arguments (e.g. [table]/[limit] under [data.read]) are not slot invocations; they are
    /// only checked for children their declaration does not take: an argument declared as a plain value
    /// with no children of its own must have none, as in a [join] wrongly placed under [limit].
    ///
    /// STILL IGNORED: undeclared names under arguments that declare children, and
    /// every node whose name starts with a "." that is not a declared body (variables, comments,
    /// [.arguments]). Note that [add]/[insert-*] source bodies ARE checked - those slots [eval]
    /// their children, so a named child is a slot invocation at runtime while "." children are
    /// static data.
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
        ReturnsDescription = "Resolves to true when every invocation is statically valid; otherwise lists missing slot names and invalid-invocation diagnostics as child nodes")]
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
             * Walking every executable statement, collecting missing slots and invalid invocations.
             * The cache memoizes each slot's metadata so signatures are reflected over once each.
             */
            var missing = new List<string>();
            var invalid = new List<string>();
            var seen = new HashSet<string>(StringComparer.Ordinal);
            var cache = new Dictionary<string, BodyInfo>(StringComparer.Ordinal);
            VerifyScope(lambda, slots, cache, missing, seen, invalid);

            // Returning true when every invocation is valid, plus diagnostics as child nodes.
            input.Clear();
            input.Value = missing.Count == 0 && invalid.Count == 0;
            input.AddRange(missing.Select(x => new Node("", x)));
            input.AddRange(invalid.Select(x => new Node("invalid-invocation", x)));
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
            HashSet<string> seen,
            List<string> invalid)
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
                        VerifyScope(node.Children, slots, cache, missing, seen, invalid);
                    continue;
                }

                // This is a slot invocation in statement position - verifying it exists.
                if (!slots.Contains(name) && seen.Add(name))
                    missing.Add(name);

                var info = BodyInfoFor(name, cache);
                VerifyInvocation(node, info, invalid);
                VerifyBodies(node, info, slots, cache, missing, seen, invalid);
                VerifyContinuations(node, info, slots, cache, missing, seen, invalid);
            }
        }

        /*
         * Descending into the slot's executable body/bodies. Every direct child is
         * routed by the slot's signature: a named wrapper ([.lambda], [case], [default],
         * [fork], [.sse]) is descended into (its children are the statements), while a
         * "*" body means the child itself is a statement. Named non-executable
         * arguments are skipped.
         */
        void VerifyBodies(
            Node node,
            BodyInfo info,
            HashSet<string> slots,
            Dictionary<string, BodyInfo> cache,
            List<string> missing,
            HashSet<string> seen,
            List<string> invalid)
        {
            foreach (var child in node.Children)
            {
                if (info.WrapperNames.Contains(child.Name) || info.NestedBodyNames.Contains(child.Name))
                    VerifyScope(child.Children, slots, cache, missing, seen, invalid);
                else if (info.HasStarBody && !info.ArgumentNames.Contains(child.Name))
                    VerifyScope(new[] { child }, slots, cache, missing, seen, invalid);
            }
        }

        /*
         * Continuation blocks are siblings, not slots. Only their children are checked,
         * and only when the preceding slot's signature declares them as continuations.
         */
        void VerifyContinuations(
            Node node,
            BodyInfo info,
            HashSet<string> slots,
            Dictionary<string, BodyInfo> cache,
            List<string> missing,
            HashSet<string> seen,
            List<string> invalid)
        {
            var continuation = node.Next;
            while (continuation != null && info.ContinuationBodyNames.Contains(continuation.Name))
            {
                VerifyScope(continuation.Children, slots, cache, missing, seen, invalid);
                continuation = continuation.Next;
            }
        }

        /*
         * Verifies the parts of an invocation that are knowable without evaluating it.
         * Expressions count as supplied primary values, but are deliberately not evaluated.
         */
        static void VerifyInvocation(Node node, BodyInfo info, List<string> invalid)
        {
            if (info.Attribute?.ValueRequired == true && node.Value == null)
                invalid.Add($"Slot [{node.Name}] requires a primary (RHS) value");

            // A slot without a documented value never reads one, so a value given to it is silently ignored.
            if (info.Attribute?.ValueMode == SlotValueMode.None && node.Value != null)
                invalid.Add($"Slot [{node.Name}] does not accept a primary (RHS) value");
            if (info.Attribute?.ValueOrChildrenRequired == true &&
                node.Value == null &&
                !node.Children.Any())
            {
                invalid.Add($"Slot [{node.Name}] requires either a primary (RHS) value or child nodes");
            }

            /*
             * The number of evaluated children must be within the range the signature declares for them,
             * summed over every evaluated declaration, e.g. the two operands of [mt], or the one or two
             * of [strings.replace]. Named arguments and wrappers are not operands. A value may stand in
             * for one operand, as in [mt:x:@.a] with one child, so either count within range is accepted.
             *
             * Not checked:
             *   - a value replacing a Condition operand, as in [if:x:@.a] or [while:x:@.a], since the
             *     children are then the body;
             *   - an invocation with neither value nor children, since its operands are commonly added
             *     at runtime, as in [add:x:+] followed by an empty [fork]. Children are only ever added,
             *     so too many operands is always reported.
             */
            var checkOperands = info.HasOperands &&
                !(info.HasConditionOperand && node.Value != null) &&
                (node.Value != null || node.Children.Any());
            if (checkOperands)
            {
                var operands = node.Children.Count(x => !info.ArgumentNames.Contains(x.Name) && !info.WrapperNames.Contains(x.Name));
                var valueOperand = node.Value != null && info.Attribute?.ValueMode != SlotValueMode.None;
                if (!info.AllowsOperands(operands) && !(valueOperand && info.AllowsOperands(operands + 1)))
                    invalid.Add($"Slot [{node.Name}] requires {info.DescribeOperands()}, but was given {operands + (valueOperand ? 1 : 0)}");
            }

            VerifyArguments(node.Name, node.Children, info.Declarations, invalid);

            // Without an attached signature, the accepted child argument names are unknown.
            if (!info.HasSignature || info.AcceptsAnyChild)
                return;
            foreach (var child in node.Children.Where(x => !info.ChildNames.Contains(x.Name)))
            {
                invalid.Add($"Slot [{node.Name}] does not accept a child argument named [{child.Name}]");
            }
        }

        /*
         * An argument the signature declares as a plain value (not of type "lambda", which holds a tree, as
         * the payload [args] of [sockets.signal] does), with no children of its own, never reads
         * children, so any child given to it is silently ignored, as in a [join] placed under [limit]
         * instead of under [table]. Arguments that declare children are descended into through the
         * children they declare by name, so the same rule applies at every level, e.g. [table]/[join]/[type].
         * A name declared more than once (alternative sections) has no single declaration to check against.
         */
        static void VerifyArguments(string slot, IEnumerable<Node> arguments, List<SlotChild> declarations, List<string> invalid)
        {
            var declared = arguments
                .Select(x => (Argument: x, Matches: declarations.FindAll(y => y.Name == x.Name)))
                .Where(x => x.Matches.Count == 1);
            foreach (var (argument, matches) in declared)
            {
                VerifyArgument(slot, argument, matches[0], invalid);
            }
        }

        static void VerifyArgument(string slot, Node argument, SlotChild declaration, List<string> invalid)
        {
            if (declaration.Children.Count > 0)
                VerifyArguments(slot, argument.Children, declaration.Children, invalid);
            else if (declaration.Mode is SlotChildMode.Value or SlotChildMode.Expression or SlotChildMode.ValueOrExpression &&
                declaration.Type != "lambda")
                invalid.AddRange(argument.Children.Select(x => $"Argument [{argument.Name}] of slot [{slot}] does not accept children, but was given [{x.Name}]"));
        }

        static (int Min, int Max) Range(SlotChildCardinality cardinality)
        {
            return cardinality switch
            {
                SlotChildCardinality.ZeroOrOne => (0, 1),
                SlotChildCardinality.ExactlyOne => (1, 1),
                SlotChildCardinality.ExactlyTwo => (2, 2),
                SlotChildCardinality.TwoOrMore => (2, int.MaxValue),
                SlotChildCardinality.OneOrMore => (1, int.MaxValue),
                _ => (0, int.MaxValue),
            };
        }

        /*
         * Body and invocation layout of a slot, derived from its metadata:
         *   - HasStarBody   : the slot declares a "*" ExecutableLambda child, so its own direct
         *                     children are executable statements.
         *   - WrapperNames         : names of NAMED ExecutableLambda children whose OWN children
         *                            are the body ([.lambda], [default], [fork], [.sse]).
         *   - NestedBodyNames      : value-bearing children carrying a nested "*" body ([case]).
         *   - ContinuationBodyNames: executable sibling blocks following the slot ([.catch],
         *                            [.finally]); these siblings are not slot invocations.
         *   - ArgumentNames        : named non-executable children to exclude from a "*" body.
         *   - OperandMin/OperandMax: how many evaluated ("*" or executable ".") children the slot takes,
         *                            summed over its evaluated declarations; HasOperands if it declares any.
         *   - HasConditionOperand  : one of them is a Condition, which a value replaces ([if], [while]).
         * "[.lambda]" is always a wrapper so signature-less slots work by convention.
         */
        sealed class BodyInfo
        {
            public SlotAttribute Attribute;
            public bool HasSignature;
            public bool AcceptsAnyChild;
            public HashSet<string> ChildNames = new HashSet<string>(StringComparer.Ordinal);
            public bool HasStarBody;
            public HashSet<string> WrapperNames = new HashSet<string>(StringComparer.Ordinal) { ".lambda" };
            public HashSet<string> NestedBodyNames = new HashSet<string>(StringComparer.Ordinal);
            public HashSet<string> ContinuationBodyNames = new HashSet<string>(StringComparer.Ordinal);
            public HashSet<string> ArgumentNames = new HashSet<string>(StringComparer.Ordinal);
            public List<SlotChild> Declarations = new List<SlotChild>();
            public bool HasOperands;
            public bool HasConditionOperand;
            public int OperandMin;
            public int OperandMax;

            public bool AllowsOperands(int count)
            {
                return count >= OperandMin && count <= OperandMax;
            }

            public string DescribeOperands()
            {
                var noun = OperandMax == 1 ? "operand" : "operands";
                if (OperandMin == OperandMax)
                    return $"exactly {OperandMin} {noun}";
                if (OperandMax == int.MaxValue)
                    return $"{OperandMin} or more {noun}";
                if (OperandMin == 0)
                    return $"at most {OperandMax} {noun}";
                return $"between {OperandMin} and {OperandMax} {noun}";
            }
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
            result.Attribute = attribute;
            if (attribute?.SignatureType == null)
                return result;
            try
            {
                ApplySignature(result, attribute.SignatureType);
            }
            catch
            {
                // A signature that cannot be instantiated tells us nothing - leaving the defaults.
            }
            return result;
        }

        /*
         * Adds what the specified signature declares to the body layout.
         */
        static void ApplySignature(BodyInfo result, Type signatureType)
        {
            if (Activator.CreateInstance(signatureType) is not ISlotSignature signature)
                return;
            foreach (var child in signature.Children ?? Enumerable.Empty<SlotChild>())
            {
                AddChild(result, child);
            }
            foreach (var constraint in signature.Constraints ?? Enumerable.Empty<SlotConstraint>())
            {
                if (constraint.Kind == SlotConstraintKind.NextSiblingMustBeOneOf)
                    result.ContinuationBodyNames.UnionWith(constraint.Values);
            }
            result.HasSignature = true;
        }

        static void AddChild(BodyInfo result, SlotChild child)
        {
            if (string.IsNullOrEmpty(child.Name))
                return;

            /*
             * An executable "." child is a positional argument the slot [eval]s, e.g. the segments of
             * [strings.concat] or the arguments of [strings.replace] and [mime.add], so it is either a
             * literal "." or a slot invocation such as [get-value]. It is therefore treated exactly like
             * a "*" body; a named child is a slot dispatched at runtime, and a "."-prefixed child is
             * static data.
             */
            var evaluated = child.Name == "*" ||
                (child.Name == "." && child.Mode == SlotChildMode.ExecutableLambda);
            if (evaluated)
            {
                result.AcceptsAnyChild = true;
                var (min, max) = Range(child.Cardinality);
                result.HasOperands = true;
                result.HasConditionOperand |= child.Role == SlotChildRole.Condition;
                result.OperandMin += min;
                result.OperandMax = result.OperandMax == int.MaxValue || max == int.MaxValue ? int.MaxValue : result.OperandMax + max;
            }
            else
            {
                /*
                 * A signature's "." child is ambiguous: [strings.split] and [strings.substring]
                 * take literal "[.]" arguments, while other slots take anonymous children.
                 */
                result.ChildNames.Add(child.Name);
                if (child.Name == ".")
                    result.ChildNames.Add("");
            }

            /*
             * Note that SourceContainer bodies ([add]/[insert-before]/[insert-after]/
             * [include]) are deliberately included here: their implementations raise
             * [eval] on their children, so a NAMED child is dispatched as a slot at
             * runtime (and throws if it does not exist), while "."-prefixed children
             * are static data - exactly the dispatch rule this walker applies.
             */
            if (child.Mode == SlotChildMode.ExecutableLambda)
            {
                if (evaluated)
                    result.HasStarBody = true;
                else
                    result.WrapperNames.Add(child.Name);
            }
            else if (child.Name != "*")
            {
                result.ArgumentNames.Add(child.Name);
                result.Declarations.Add(child);
                if (child.Children.Any(x => x.Name == "*" && x.Mode == SlotChildMode.ExecutableLambda))
                    result.NestedBodyNames.Add(child.Name);
            }
        }

        #endregion
    }
}
