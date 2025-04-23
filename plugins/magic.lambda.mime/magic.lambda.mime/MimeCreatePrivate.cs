/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Threading.Tasks;
using magic.node;
using magic.node.contracts;
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
    [Slot(Name = ".mime.create")]
    public class MimeCreatePrivate : ISlotAsync
    {
        readonly IStreamService _streamService;
        readonly IRootResolver _rootResolver;

        /// <summary>
        /// Creates an instance of your type.
        /// </summary>
        /// <param name="streamService">Needed in case MIME creator needs to create entities from file service</param>
        /// <param name="rootResolver">Needed to resolve root folder</param>
        public MimeCreatePrivate(IStreamService streamService, IRootResolver rootResolver)
        {
            _streamService = streamService;
            _rootResolver = rootResolver;
        }

        /// <summary>
        /// Implementation of your slot.
        /// </summary>
        /// <param name="signaler">Signaler that raised the signal.</param>
        /// <param name="input">Arguments to your slot.</param>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            // Creating entity and returning to caller as is.
            input.Value = await MimeCreator.CreateAsync(signaler, input, _streamService, _rootResolver);
            input.Clear();
        }
    }
}
