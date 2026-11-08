/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.node.extensions.hyperlambda;

namespace magic.lambda.hyperlambda
{
    /// <summary>
    /// [hyper] slot for creating Hyperlambda from a lambda hierarchy.
    /// </summary>
    [Slot(
        Name = "lambda2hyper",
        Description = "Transforms a lambda hierarchy into Hyperlambda",
        ValueKind = "lambda-tree,node-list",
        ValueDescription = "Expression selecting the lambda hierarchy to transform",
        ValueOrChildrenRequired = true,
        ValueMode = SlotValueMode.Expression,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "hyperlambda,text",
        ReturnsDescription = "Resolves to the generated Hyperlambda source",
        SignatureType = typeof(global::magic.lambda.hyperlambda.signatures.Lambda2HyperSignature))]
    public class Lambda2Hyper : ISlot
    {
        /// <summary>
        /// Implementation of your slot.
        /// </summary>
        /// <param name="signaler">Signaler that raised the signal.</param>
        /// <param name="input">Arguments to your slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            // Sanity checking invocation.
            if (input.Value == null && !input.Children.Any())
                throw new HyperlambdaException("Provide either children nodes or expression value to [lambda2hyper]");

            // Checking type of invocation, and acting accordingly.
            if (input.Value is Expression)
            {
                input.Value = HyperlambdaGenerator
                    .GetHyperlambda(
                        input.Evaluate(),
                        input
                            .Children
                            .FirstOrDefault(x => x.Name == "comments")?
                            .GetEx<bool>() ?? false);
            }
            else
            {
                input.Value = HyperlambdaGenerator.GetHyperlambda(input.Children);
            }
        }
    }
}
