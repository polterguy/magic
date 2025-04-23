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
    /// [type] slot allowing you to retrieve Hyperlambda type information for some specified value.
    /// </summary>
    [Slot(Name = "type")]
    public class Type : ISlot
    {
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var ex = input.Value as Expression ?? throw new HyperlambdaException("No expression given to [type]");
            var value = ex.Evaluate(input).Single().Value;
            var result = Converter.ToString(value);
            input.Value = result.Item1;
        }
    }
}
