/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using System.Threading.Tasks;

namespace magic.endpoint.services.slots.misc
{
    /// <summary>
    /// [mime.add] slot for associating a file extension with a MIME type.
    /// </summary>
    [Slot(
        Name = "mime.add",
        Description = "Associates a file extension with a MIME content-type so the server returns the correct Content-Type header for matching responses",
        ValueKind = "content-type",
        ValueDescription = "File extension or MIME type key to register",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.None,
        SignatureType = typeof(global::magic.endpoint.services.signatures.MimeAddSignature))]
    public class AddMimeType : ISlotAsync
    {
        /// <summary>
        /// Implementation of your slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise signal.</param>
        /// <param name="input">Arguments to your slot.</param>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            /*
             * Resolving extension before evaluating children, since this is the value the whitelist
             * approved, and no child should be able to change it afterwards.
             */
            var extension = input.GetEx<string>();

            // Evaluating children, to make sure any signals wanting to retrieve our content type is evaluated.
            await signaler.SignalAsync("eval", input, skipWhitelist: true);
            HttpFileExecutorAsync.AddMimeType(extension, input.Children.First().GetEx<string>());
        }
    }
}
