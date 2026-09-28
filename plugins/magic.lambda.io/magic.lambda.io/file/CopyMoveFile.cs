/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Threading.Tasks;
using magic.node;
using magic.node.contracts;
using magic.lambda.io.helpers;
using magic.signals.contracts;

namespace magic.lambda.io.file
{
    /// <summary>
    /// [io.file.copy]/[io.file.move] slot for moving a file on your server.
    /// </summary>
    [Slot(
        Name = "io.file.copy",
        Description = "Copies a file on the server",
        ValueKind = "file-path",
        ValueDescription = "Source file path",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.None,
        SignatureType = typeof(global::magic.lambda.io.signatures.FileCopyMoveSignature))]
    [Slot(
        Name = "io.file.move",
        Description = "Moves a file on the server",
        ValueKind = "file-path",
        ValueDescription = "Source file path",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.None,
        SignatureType = typeof(global::magic.lambda.io.signatures.FileCopyMoveSignature))]
    public class CopyMoveFile : ISlotAsync, IWhitelistComparer
    {

        /// <inheritdoc />
        public Func<string, string, bool> Comparer => Utilities.MatchesPath;
        readonly IRootResolver _rootResolver;
        readonly IIOService _service;

        /// <summary>
        /// Constructs a new instance of your type.
        /// </summary>
        /// <param name="rootResolver">Instance used to resolve the root folder of your app.</param>
        /// <param name="service">Underlaying file service implementation.</param>
        public CopyMoveFile(IRootResolver rootResolver, IFileService service)
        {
            _rootResolver = rootResolver;
            _service = service;
        }

        /// <summary>
        /// Implementation of slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise the signal.</param>
        /// <param name="input">Arguments to slot.</param>
        /// <returns>An awaitable task.</returns>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            await Utilities.CopyMoveHelperAsync(
                signaler,
                _rootResolver,
                input,
                _service,
                input.Name == "io.file.copy",
                false);
        }
    }
}
