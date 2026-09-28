/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Threading.Tasks;
using magic.node;
using magic.signals.contracts;
using magic.lambda.mime.helpers;

namespace magic.lambda.mime
{
    /// <summary>
    /// Creates a MIME entity and returns it as a MimeKit MimeEntity to caller (hidden).
    /// 
    /// Notice, caller is responsible for disposing any streams created during process, but this
    /// can be easily done by using the MimeBuilder.DisposeStreams on the MimeEntity returned.
    /// </summary>
    [Slot(
        Name = ".mime.create",
        Description = "Creates a MIME message without exposing the public wrapper slot",
        ValueKind = "content-type",
        ValueDescription = "Primary MIME content type",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "mime-message",
        ReturnsDescription = "Resolves to the created MimeKit MIME entity")]
    public class MimeCreatePrivate : ISlotAsync
    {
        /// <summary>
        /// Implementation of your slot.
        /// </summary>
        /// <param name="signaler">Signaler that raised the signal.</param>
        /// <param name="input">Arguments to your slot.</param>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            // Creating entity and returning to caller as is.
            input.Value = await MimeCreator.CreateAsync(signaler, input);
            input.Clear();
        }
    }
}
