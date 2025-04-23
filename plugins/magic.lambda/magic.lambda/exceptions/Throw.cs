/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
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
    [Slot(Name = "throw")]
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
