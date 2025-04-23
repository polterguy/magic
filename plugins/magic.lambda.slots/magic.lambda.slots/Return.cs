/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.slots
{
    /// <summary>
    /// [return] slot for returning nodes or a single value from some evaluation object.
    /// </summary>
    [Slot(Name = "return")]
    public class Return : ISlot
    {
        /// <summary>
        /// Slot implementation.
        /// </summary>
        /// <param name="signaler">Signaler that raised signal.</param>
        /// <param name="input">Arguments to slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var result = signaler.Peek<Node>("slots.result");
            if (input.Children.Any())
            {
                // Simple case
                result.AddRange(input.Children.ToList());
                result.Value = input.Value;
            }
            else
            {
                // Checking if we have an expression value.
                if (input.Value is Expression exp)
                {
                    var expResult = exp.Evaluate(input).ToList();
                    if (expResult.Count == 1)
                        result.Value = expResult.First().Value;
                    else if (expResult.Count > 1)
                        result.AddRange(expResult.Select(x => x.Clone()));
                }
                else
                {
                    // Single return value.
                    result.Value = input.Value;
                }
            }
        }
    }
}
