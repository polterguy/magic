/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System;
using magic.node;
using magic.signals.contracts;

namespace magic.lambda.guid
{
    /// <summary>
    /// [guid.new] slot for generating a new guid.
    /// </summary>
    [Slot(
        Name = "guid.new",
        Description = "Generates a random version-4 GUID for use as a unique identifier",
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "guid,text",
        ReturnsDescription = "Resolves to a new GUID string")]
    public class GuidNew : ISlot
    {
        /// <summary>
        /// Slot implementation.
        /// </summary>
        /// <param name="signaler">Signaler that raised the signal.</param>
        /// <param name="input">Arguments to slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            input.Value = Guid.NewGuid();
        }
    }
}
