/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.misc
{
    /// <summary>
    /// [compose] slot allowing you to dynamically compose an expression.
    /// </summary>
    [Slot(Name = "compose")]
    public class Compose : ISlot
    {
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var iterators = input.Children.Select(x => x.GetEx<string>());
            var expression = string.Join("/", iterators.ToArray());
            input.Clear();
            input.Value = new Expression(expression);
        }
    }
}
