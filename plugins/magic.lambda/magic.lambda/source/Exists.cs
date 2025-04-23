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
    /// [exists] slot returning true if whatever expression it's given actually yields a result.
    /// </summary>
    [Slot(Name = "exists")]
    [Slot(Name = "not-exists")]
    public class Exists : ISlot
    {
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var hasAny = input.Evaluate().Any();
            input.Value = input.Name == "exists" ? hasAny : !hasAny;
        }
    }
}
