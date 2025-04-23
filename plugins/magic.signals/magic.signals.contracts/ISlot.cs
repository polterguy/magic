/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using magic.node;

namespace magic.signals.contracts
{
    /// <summary>
    /// Interface you need to implement on classes you want to be able to
    /// dynamically invoke as signals.
    ///
    /// Notice, there exists an async version of this interface, which you can
    /// implement for slots requiring async behaviour.
    /// </summary>
    public interface ISlot
    {
        /// <summary>
        /// Invoked whenever the specified signal for your slot is signaled.
        /// </summary>
        /// <param name="signaler">The signaler that invoked your slot.</param>
        /// <param name="input">Input arguments to your slot.</param>
        void Signal(ISignaler signaler, Node input);
    }
}
