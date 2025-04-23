/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.slots
{
    /// <summary>
    /// [get-context] slot allowing you to retrieve a previously created
    /// context object, added to the stack using [context].
    /// 
    /// Notice, the slot will automatically prepend 'dynamic.' in front
    /// of the name as it retrieves the context object, to prevent Hyperlambda
    /// from being able to retrieve objects intended for only being used
    /// by C# code - which would have been a security issue it was allowed.
    /// </summary>
    [Slot(Name = "get-context")]
    public class GetContext : ISlot
    {
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        public void Signal(ISignaler signaler, Node input)
        {
            input.Value = signaler.Peek<object>("dynamic." + input.GetEx<string>());
        }
    }
}
