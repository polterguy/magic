/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */
using System.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.validators.validators
{
    /// <summary>
    /// [validators.default] slot, for verifying that some input was given, and if not,
    /// create a node containing some default value.
    /// </summary>
    [Slot(Name = "validators.default")]
    public class ValidateDefault : ISlot
    {
        /// <summary>
        /// Implementation of slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise the signal.</param>
        /// <param name="input">Arguments to signal.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            // Finding node collection verifying it's got all the nodes with the specified name.
            foreach (var idxDest in input.Evaluate())
            {
                foreach (var idxSrc in input.Children)
                {
                    var cur = idxDest.Children.FirstOrDefault(x => x.Name == idxSrc.Name);
                    if (cur == null)
                        idxDest.Add(idxSrc.Clone());
                    else if (cur.Value == null)
                        cur.Value = idxSrc.Value;
                }
            }

            // House cleaning.
            input.Clear();
        }
    }
}
