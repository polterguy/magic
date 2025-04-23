/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
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
