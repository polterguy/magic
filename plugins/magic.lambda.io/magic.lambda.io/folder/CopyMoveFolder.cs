/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Threading.Tasks;
using magic.node;
using magic.node.contracts;
using magic.lambda.io.helpers;
using magic.signals.contracts;

namespace magic.lambda.io.folder
{
    /// <summary>
    /// [io.folder.copy]/[io.folder.move] slot for copying a folder on your server.
    /// </summary>
    [Slot(
        Name = "io.folder.copy",
        Description = "Copies a folder on the server",
        ValueKind = "folder-path",
        ValueDescription = "Source folder path",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.None,
        SignatureType = typeof(global::magic.lambda.io.signatures.FolderCopyMoveSignature))]
    [Slot(
        Name = "io.folder.move",
        Description = "Moves a folder on the server",
        ValueKind = "folder-path",
        ValueDescription = "Source folder path",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.None,
        SignatureType = typeof(global::magic.lambda.io.signatures.FolderCopyMoveSignature))]
    public class CopyMoveFolder : ISlotAsync, IWhitelistComparer
    {

        /// <inheritdoc />
        public Func<string, string, bool> Comparer => Utilities.MatchesFolder;
        readonly IRootResolver _rootResolver;
        readonly IIOService _service;

        /// <summary>
        /// Constructs a new instance of your type.
        /// </summary>
        /// <param name="rootResolver">Instance used to resolve the root folder of your app.</param>
        /// <param name="service">Underlaying folder service implementation.</param>
        public CopyMoveFolder(IRootResolver rootResolver, IFolderService service)
        {
            _rootResolver = rootResolver;
            _service = service;
        }

        /// <summary>
        /// Implementation of slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise the signal.</param>
        /// <param name="input">Arguments to slot.</param>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            await Utilities.CopyMoveHelperAsync(
                signaler,
                _rootResolver,
                input,
                _service,
                input.Name == "io.folder.copy",
                true);
        }
    }
}
