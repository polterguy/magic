/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System;
using System.Collections.Generic;

namespace magic.signals.contracts
{
    /// <summary>
    /// Interface responsible for feeding your signaler with slots,
    /// implying string to type mappings.
    /// </summary>
    public interface ISignalsProvider
    {
        /// <summary>
        /// Returns a type from the specified name.
        /// </summary>
        /// <param name="name">Slot name for the type to return.</param>
        /// <returns>The underlaying type that maps to your string.</returns>
        Type GetSlot(string name);

        /// <summary>
        /// Returns a shared instance of the slot with the specified name, if the slot holds no state, implying it
        /// has no instance fields and no constructor arguments, and returns null otherwise.
        /// </summary>
        /// <param name="name">Slot name for the instance to return.</param>
        /// <returns>A slot instance that is safe to reuse, or null if a new instance must be created for each invocation.</returns>
        object GetStatelessSlot(string name) => null;

        /// <summary>
        /// Same as <see cref="GetStatelessSlot"/>, but with the shared instance already resolved to the slot interfaces
        /// it implements, saving the caller from type-checking it for each invocation.
        /// </summary>
        /// <param name="name">Slot name for the instance to return.</param>
        /// <returns>The shared instance as each interface it implements, or both null if a new instance must be created.</returns>
        (ISlot Sync, ISlotAsync Async) GetSharedSlot(string name)
        {
            var instance = GetStatelessSlot(name);
            return (instance as ISlot, instance as ISlotAsync);
        }

        /// <summary>
        /// Returns true if a [whitelist] may name the slot with the specified name in its vocabulary,
        /// which is declared on the slot with <see cref="SlotAttribute.Whitelistable"/>. A name that
        /// is not a registered slot, such as a dynamic slot, is whitelistable.
        /// </summary>
        /// <param name="name">Slot name to check.</param>
        /// <returns>False if the slot declares that it can never be whitelisted.</returns>
        bool IsWhitelistable(string name) => true;

        /// <summary>
        /// Returns true if a [whitelist] must pin the slot with the specified name to a value in its
        /// vocabulary, which is declared on the slot with <see cref="SlotAttribute.PinRequired"/>. A name
        /// that is not a registered slot, such as a dynamic slot, needs no pin.
        /// </summary>
        /// <param name="name">Slot name to check.</param>
        /// <returns>True if the slot declares that a vocabulary entry for it must carry a pin.</returns>
        bool RequiresPin(string name) => false;

        /// <summary>
        /// Returns all keys, implying names registered for your signals
        /// implementation.
        /// </summary>
        IEnumerable<string> Keys { get; }

        /// <summary>
        /// Adds the specified type as a slot implementation.
        /// </summary>
        /// <param name="type">Type to add.</param>
        void Add(Type type);

        /// <summary>
        /// Removes the specified type as a slot resolver.
        /// </summary>
        /// <param name="type">Type to remove.</param>
        void Remove(Type type);
    }
}
