/*
 * Magic Cloud, copyright (c) 2026 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;

namespace magic.signals.contracts
{
    /// <summary>
    /// Optionally implemented by an ISlot or ISlotAsync class needing to decide for itself how a
    /// whitelist vocabulary pin is compared to the argument it was invoked with.
    ///
    /// Notice, the default comparison treats both as plain strings, which is right for a slot whose
    /// argument IS its value - a database name, a URL, a dynamic slot name. Implement this only
    /// when your argument has its own notion of equality, the way a file path does.
    /// </summary>
    public interface IWhitelistComparer
    {
        /// <summary>
        /// Function comparing a vocabulary pin to an argument, returning true if they match.
        /// </summary>
        Func<string, string, bool> Comparer { get; }
    }
}
