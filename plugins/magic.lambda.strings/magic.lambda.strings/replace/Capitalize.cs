/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.strings.replace
{
    /// <summary>
    /// [strings.capitalize] slot that returns the Capitalized value of its specified argument.
    /// </summary>
    [Slot(Name = "strings.capitalize")]
    public class Capitalize : ISlot
    {
        /// <summary>
        /// Implementation of slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise signal.</param>
        /// <param name="input">Arguments to your slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var str = input.GetEx<string>();
            if (str.Length > 0)
                input.Value = 
                    char.ToUpperInvariant(str.First()).ToString() +
                    str.Substring(1);
        }
    }
}
