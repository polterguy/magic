/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.node.extensions.hyperlambda;

namespace magic.lambda.exceptions
{
    /// <summary>
    /// [throw] slot that throws an exception.
    /// </summary>
    [Slot(
        Name = "throw",
        Description = "Aborts execution by throwing an exception with the given message; optionally attach status code and public flag",
        ValueKind = "exception-message,text",
        ValueDescription = "Exception message to throw",
        ValueRequired = false,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.None,
        IsBlockTerminator = true,
        PipelineOutputUsable = false,
        SignatureType = typeof(global::magic.lambda.signatures.ThrowSignature))]
    public class Throw : ISlot
    {
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var isPublic = input.Children
                .FirstOrDefault(x => x.Name == "public")?
                .GetEx<bool>() ?? false;

            var status = input.Children
                .FirstOrDefault(x => x.Name == "status")?
                .GetEx<int>() ?? 500;

            var field = input.Children
                .FirstOrDefault(x => x.Name == "field")?
                .GetEx<string>();

            var root = input;
            while (root.Parent != null)
            {
                root = root.Parent;
            }
            var stackTrace = HyperlambdaGenerator.GetHyperlambda(root.Children);

            // Throwing exception.
            throw new HyperlambdaException(
                input.GetEx<string>() ?? "[no-message]",
                isPublic,
                status,
                field,
                stackTrace);
        }
    }
}
