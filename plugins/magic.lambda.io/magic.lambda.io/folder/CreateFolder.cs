/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Threading.Tasks;
using magic.node;
using magic.node.contracts;
using magic.node.extensions;
using magic.signals.contracts;
using magic.lambda.io.helpers;

namespace magic.lambda.io.folder
{
    /// <summary>
    /// [io.folder.create] slot for creating a new folder on server.
    /// </summary>
    [Slot(
        Name = "io.folder.create",
        Description = "Creates a folder on the server",
        ValueKind = "folder-path",
        ValueDescription = "Folder path to create",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.None)]
    public class CreateFolder : ISlotAsync, IWhitelistComparer
    {

        /// <inheritdoc />
        public Func<string, string, bool> Comparer => Utilities.MatchesPath;
        readonly IRootResolver _rootResolver;
        readonly IFolderService _service;

        /// <summary>
        /// Constructs a new instance of your type.
        /// </summary>
        /// <param name="rootResolver">Instance used to resolve the root folder of your app.</param>
        /// <param name="service">Underlaying file service implementation.</param>
        public CreateFolder(IRootResolver rootResolver, IFolderService service)
        {
            _rootResolver = rootResolver;
            _service = service;
        }

        /// <summary>
        /// Implementation of slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise the signal.</param>
        /// <param name="input">Arguments to slot.</param>
        /// <returns>Awaitable task</returns>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            await _service.CreateAsync(_rootResolver.AbsolutePath(input.GetEx<string>()));
        }
    }
}
