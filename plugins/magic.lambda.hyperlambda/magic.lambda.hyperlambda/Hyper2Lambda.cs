/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.node.extensions.hyperlambda;

namespace magic.lambda.hyperlambda
{
    /// <summary>
    /// [lambda] slot, allowing you to transform a piece of Hyperlambda to a lambda hierarchy.
    /// </summary>
    [Slot(
        Name = "hyper2lambda",
        Description = "Transforms Hyperlambda into a lambda hierarchy",
        ValueKind = "hyperlambda",
        ValueDescription = "Hyperlambda text to transform",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.Lambda,
        ReturnsKind = "lambda-tree",
        ReturnsDescription = "Resolves to the parsed lambda hierarchy as child nodes",
        SignatureType = typeof(global::magic.lambda.hyperlambda.signatures.Hyper2LambdaSignature))]
    public class Hyper2Lambda : ISlot
    {
        /// <summary>
        /// Implementation of your slot.
        /// </summary>
        /// <param name="signaler">Signaler that raised the signal.</param>
        /// <param name="input">Arguments to your slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var comments = input.Children.FirstOrDefault(x => x.Name == "comments")?.GetEx<bool>() ?? false;
            input.Clear();
            var parser = HyperlambdaParser.Parse(input.GetEx<string>(), comments);
            input.MoveChildrenFrom(parser);
            input.Value = null;
        }
    }
}
