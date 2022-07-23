/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

using magic.node;
using magic.signals.contracts;

namespace magic.backend.slots
{
    /// <summary>
    /// [version] slot returning the version of Magic that is currently being used.
    /// </summary>
    [Slot(Name = "version")]
    public class Version : ISlot
    {
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        public void Signal(ISignaler signaler, Node input)
        {
            input.Value = "v14.0.11";
        }
    }
}
