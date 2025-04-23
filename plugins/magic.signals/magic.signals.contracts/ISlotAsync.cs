/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Threading.Tasks;
using magic.node;

namespace magic.signals.contracts
{
    /// <summary>
    /// Interface you need to implement on classes you want to be able to
    /// dynamically invoke as signals.
    ///
    /// Notice, there exists a synchronous version of this interface for signals
    /// you don't want to implement as async. You should as a general rule
    /// implement also the sync equivalent of this interface, if you implement
    /// this interface, to allow consumers to also invoke your slot synchronously.
    /// </summary>
    public interface ISlotAsync
    {
        /// <summary>
        /// Invoked whenever the specified signal for your slot is signaled.
        /// </summary>
        /// <param name="signaler">The signaler that invoked your slot.</param>
        /// <param name="input">Input arguments to your slot.</param>
        /// <returns>Awaitable task.</returns>
        Task SignalAsync(ISignaler signaler, Node input);
    }
}
