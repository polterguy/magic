/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.source
{
    /// <summary>
    /// [reference] slot that will set its own value to the specified expression's evaluated node, by reference.
    /// </summary>
    [Slot(Name = "reference")]
    public class Reference : ISlot
    {
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        public void Signal(ISignaler signaler, Node input)
        {
            if (input.Value == null)
                throw new HyperlambdaException("No value provided to [reference]");

            var src = input.Evaluate();
            if (src.Count() > 1)
                throw new HyperlambdaException("Expressions provided to [reference] returned more than one node");
            input.Value = src.FirstOrDefault();
        }
    }
}
