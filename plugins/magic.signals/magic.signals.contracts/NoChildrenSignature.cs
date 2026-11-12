/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System;
using System.Collections.Generic;

namespace magic.signals.contracts
{
    /// <summary>
    /// Signature for slots that read nothing but their primary value, so any child
    /// node given to them is ignored. Attaching it lets [hyperlambda.verify-slots]
    /// flag such children, where a missing signature means "unknown children".
    /// </summary>
    public sealed class NoChildrenSignature : ISlotSignature
    {
        /// <inheritdoc />
        public IEnumerable<SlotChild> Children => Array.Empty<SlotChild>();
    }
}
