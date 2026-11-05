/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using magic.node;
using magic.signals.contracts;

namespace magic.endpoint.services.slots.misc
{
    /// <summary>
    /// [mime.list] slot for listing all mime types registered in current installation.
    /// </summary>
    [Slot(
        Name = "mime.list",
        Description = "Lists registered MIME type mappings",
        ReturnsMode = SlotReturnsMode.Lambda,
        ReturnsKind = "mime-type-list,string-list",
        ReturnsElementKind = "mime-type-mapping,text",
        ReturnsDescription = "Resolves to one named child node per registered MIME type mapping, where the child name is the file extension and the value is the MIME type")]
    public class GetMimeTypes : ISlot
    {
        /// <summary>
        /// Implementation of your slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise signal.</param>
        /// <param name="input">Arguments to your slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            foreach (var idx in HttpFileExecutorAsync.GetMimeTypes())
            {
                input.Add(new Node(idx.Ext, idx.Mime));
            }
        }
    }
}
