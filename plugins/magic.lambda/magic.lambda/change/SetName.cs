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
    /// [set-name] slot allowing you to change the names of nodes in your lambda graph object.
    /// </summary>
    [Slot(Name = "set-name")]
    public class SetName : ISlot
    {
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        /// <returns>An awaitable task.</returns>
        public void Signal(ISignaler signaler, Node input)
        {
            SanityCheck(input);
            signaler.Signal("eval", input);
            SetNameToSource(input);
        }

        #region [ -- Private helper methods -- ]

        static void SetNameToSource(Node input)
        {
            var source = input.Children.FirstOrDefault()?.GetEx<string>() ?? "";
            foreach (var idx in input.Evaluate())
            {
                idx.Name = source;
            }
        }

        static void SanityCheck(Node input)
        {
            if (input.Children.Count() > 1)
                throw new HyperlambdaException("[set-name] can have maximum one child node");
        }

        #endregion
    }
}
