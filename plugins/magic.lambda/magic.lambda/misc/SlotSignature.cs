/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Collections.Generic;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.misc
{
    /// <summary>
    /// [slot.signature] slot allowing you to retrieve the documented
    /// input and output contract of a single compiled slot.
    /// </summary>
    [Slot(
        Name = "slot.signature",
        Description = "Returns the documented input and output contract for a single compiled slot",
        ValueKind = "slot-name",
        ValueDescription = "Name of the compiled slot to inspect",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.Lambda,
        ReturnsKind = "slot-signature,lambda-tree",
        ReturnsDescription = "Resolves to input and output contract metadata for the requested slot")]
    public class SlotSignature : ISlot
    {
        readonly ISignalsProvider _signalProvider;

        /// <summary>
        /// Constructor creating an object requiring a signals provider to be able to fetch slot types.
        /// </summary>
        /// <param name="signalProvider">Slot provider, providing all slots that exists in the system.</param>
        public SlotSignature(ISignalsProvider signalProvider)
        {
            _signalProvider = signalProvider;
        }

        /// <summary>
        /// Implementation of signal.
        /// </summary>
        /// <param name="signaler">Signaler used to signal.</param>
        /// <param name="input">Parameters passed from signaler.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var name = input.GetEx<string>();
            if (string.IsNullOrWhiteSpace(name))
                throw new HyperlambdaException("No slot name supplied to [slot.signature]");

            var whitelist = signaler.Peek<List<Node>>("whitelist");
            if (whitelist != null && !whitelist.Any(x => x.Name == name && (x.Value == null || x.Get<string>() == name)))
                throw new HyperlambdaException($"[{name}] slot does not exist");

            var type = _signalProvider.GetSlot(name) ??
                throw new HyperlambdaException($"[{name}] slot does not exist");

            var signature = type
                .GetCustomAttributes(true)
                .OfType<SlotAttribute>()
                .FirstOrDefault(x => x.Name == name) ??
                    throw new HyperlambdaException($"[{name}] slot does not exist");

            input.Clear();
            input.Value = null;
            if (HasInput(signature))
                input.Add(CreateInputNode(signature));
            ISlotSignature provider = null;
            if (HasSignatureProvider(signature))
            {
                provider = CreateProvider(signature);
                if (provider.Children.Any())
                    input.Add(CreateChildrenNode(provider));
                if (provider.Constraints.Any())
                    input.Add(CreateConstraintsNode(provider.Constraints));
            }
            if (HasScope(signature))
                input.Add(CreateScopeNode(signature));
            if (HasOutput(signature))
                input.Add(CreateOutputNode(signature, provider));
        }

        #region [ -- Private helper methods -- ]

        /*
         * Returns true if the slot documents any input value contract.
         */
        static bool HasInput(SlotAttribute signature)
        {
            return
                !string.IsNullOrEmpty(signature.ValueKind) ||
                !string.IsNullOrEmpty(signature.ValueDescription) ||
                signature.ValueRequired ||
                signature.ValueMode != SlotValueMode.None;
        }

        /*
         * Returns true if the slot documents any output contract.
         */
        static bool HasOutput(SlotAttribute signature)
        {
            return
                signature.ReturnsMode != SlotReturnsMode.None ||
                !string.IsNullOrEmpty(signature.ReturnsKind) ||
                !string.IsNullOrEmpty(signature.ReturnsDescription);
        }

        /*
         * Returns true if the slot documents child node contracts.
         */
        static bool HasSignatureProvider(SlotAttribute signature)
        {
            return signature.SignatureType != null;
        }

        /*
         * Returns true if the slot documents runtime scope contracts.
         */
        static bool HasScope(SlotAttribute signature)
        {
            return
                !string.IsNullOrEmpty(signature.ProvidesScope) ||
                !string.IsNullOrEmpty(signature.RequiresScope) ||
                !string.IsNullOrEmpty(signature.ScopeDescription);
        }

        /*
         * Creates the [input] node describing the slot's value contract.
         */
        static Node CreateInputNode(SlotAttribute signature)
        {
            var result = new Node("input");
            if (!string.IsNullOrEmpty(signature.ValueKind))
                result.Add(new Node("kind", signature.ValueKind));
            result.Add(new Node("description", signature.ValueDescription));
            result.Add(new Node("required", signature.ValueRequired));
            result.Add(new Node("mode", signature.ValueMode.ToString()));
            return result;
        }

        /*
         * Creates the [output] node describing the slot's documented return contract.
         */
        static Node CreateOutputNode(SlotAttribute signature, ISlotSignature provider)
        {
            var result = new Node("output");
            result.Add(new Node("mode", signature.ReturnsMode.ToString()));
            if (!string.IsNullOrEmpty(signature.ReturnsKind))
                result.Add(new Node("kind", signature.ReturnsKind));
            if (!string.IsNullOrEmpty(signature.ReturnsElementKind))
                result.Add(new Node("element-kind", signature.ReturnsElementKind));
            result.Add(new Node("description", signature.ReturnsDescription));
            if (provider?.OutputChildren?.Any() ?? false)
            {
                var children = new Node("children");
                children.AddRange(provider.OutputChildren.Select(CreateChildNode));
                result.Add(children);
            }
            return result;
        }

        /*
         * Creates the [scope] node describing runtime scope contracts.
         */
        static Node CreateScopeNode(SlotAttribute signature)
        {
            var result = new Node("scope");
            if (!string.IsNullOrEmpty(signature.ProvidesScope))
                result.Add(new Node("provides", signature.ProvidesScope));
            if (!string.IsNullOrEmpty(signature.RequiresScope))
                result.Add(new Node("requires", signature.RequiresScope));
            if (!string.IsNullOrEmpty(signature.ScopeDescription))
                result.Add(new Node("description", signature.ScopeDescription));
            return result;
        }

        /*
         * Creates the [children] node describing child nodes accepted by the slot.
         */
        static ISlotSignature CreateProvider(SlotAttribute signature)
        {
            return Activator.CreateInstance(signature.SignatureType) as ISlotSignature ??
                throw new HyperlambdaException($"Signature type '{signature.SignatureType.FullName}' does not implement {nameof(ISlotSignature)}");
        }

        /*
         * Creates the [children] node describing child nodes accepted by the slot.
         */
        static Node CreateChildrenNode(ISlotSignature provider)
        {
            var result = new Node("children");
            result.AddRange(provider.Children.Select(CreateChildNode));
            return result;
        }

        /*
         * Creates a child signature node recursively.
         */
        static Node CreateChildNode(SlotChild child)
        {
            var result = new Node(child.Name);
            result.Add(new Node("type", child.Type));
            if (!string.IsNullOrEmpty(child.Kind))
                result.Add(new Node("kind", child.Kind));
            if (!string.IsNullOrEmpty(child.ElementType))
                result.Add(new Node("element-type", child.ElementType));
            if (!string.IsNullOrEmpty(child.ElementKind))
                result.Add(new Node("element-kind", child.ElementKind));
            result.Add(new Node("description", child.Description));
            result.Add(new Node("required", child.Required));
            result.Add(new Node("mode", child.Mode.ToString()));
            result.Add(new Node("cardinality", child.Cardinality.ToString()));
            if (!string.IsNullOrEmpty(child.DefaultValue))
                result.Add(new Node("default", child.DefaultValue));
            if (!string.IsNullOrEmpty(child.ExclusiveWith))
                result.Add(new Node("exclusive-with", child.ExclusiveWith));
            if (child.Preprocess != SlotChildPreprocess.None)
                result.Add(new Node("preprocess", child.Preprocess.ToString()));
            if (child.Role != SlotChildRole.None)
                result.Add(new Node("role", child.Role.ToString()));
            if (child.Evaluation != SlotChildEvaluation.None)
                result.Add(new Node("evaluation", child.Evaluation.ToString()));
            if (child.Projection != SlotChildProjection.None)
                result.Add(new Node("projection", child.Projection.ToString()));
            if (child.Constraints.Any())
                result.Add(CreateConstraintsNode(child.Constraints));
            if (child.Children.Any())
            {
                var children = new Node("children");
                children.AddRange(child.Children.Select(CreateChildNode));
                result.Add(children);
            }
            return result;
        }

        /*
         * Creates a [constraints] node.
         */
        static Node CreateConstraintsNode(IEnumerable<SlotConstraint> constraints)
        {
            var result = new Node("constraints");
            result.AddRange(constraints.Select(CreateConstraintNode));
            return result;
        }

        /*
         * Creates a single constraint node.
         */
        static Node CreateConstraintNode(SlotConstraint constraint)
        {
            var result = new Node(constraint.Kind.ToString());
            if (!string.IsNullOrEmpty(constraint.Target))
                result.Add(new Node("target", constraint.Target));
            if (!string.IsNullOrEmpty(constraint.Description))
                result.Add(new Node("description", constraint.Description));
            if (!string.IsNullOrEmpty(constraint.ValuePattern))
                result.Add(new Node("value-pattern", constraint.ValuePattern));
            if (constraint.Values.Any())
            {
                var values = new Node("values");
                values.AddRange(constraint.Values.Select(x => new Node(".", x)));
                result.Add(values);
            }
            return result;
        }

        #endregion
    }
}
