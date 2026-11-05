/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Collections.Generic;

namespace magic.signals.contracts
{
    /// <summary>
    /// Contract for types providing structured documentation for child nodes
    /// accepted by a slot.
    /// </summary>
    public interface ISlotSignature
    {
        /// <summary>
        /// Child nodes accepted by the slot.
        /// </summary>
        IEnumerable<SlotChild> Children { get; }

        /// <summary>
        /// Child nodes returned by the slot.
        /// </summary>
        IEnumerable<SlotChild> OutputChildren => new List<SlotChild>();

        /// <summary>
        /// Structural constraints applying to the slot invocation.
        /// </summary>
        IEnumerable<SlotConstraint> Constraints => new List<SlotConstraint>();
    }
}
