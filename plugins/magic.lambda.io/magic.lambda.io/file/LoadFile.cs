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

namespace magic.lambda.io.file
{
    /// <summary>
    /// [io.file.load] slot for loading a file on your server.
    /// </summary>
    [Slot(
        Name = "load-file",
        Description = "Loads a text file from the server",
        ValueKind = "file-path",
        ValueDescription = "File path to load",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "text-file-content,text",
        ReturnsDescription = "Resolves to the loaded file content")]
    [Slot(
        Name = "io.file.load",
        Description = "Loads a text file from the server",
        ValueKind = "file-path",
        ValueDescription = "File path to load",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "text-file-content,text",
        ReturnsDescription = "Resolves to the loaded file content")]
    [Slot(
        Name = "io.file.load.binary",
        Description = "Loads a binary file from the server",
        ValueKind = "binary-file",
        ValueDescription = "File path to load",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "binary-file-content,binary-content,fingerprint-source",
        ReturnsDescription = "Resolves to the loaded binary file bytes")]
    public class LoadFile : ISlotAsync, IWhitelistComparer
    {

        /// <inheritdoc />
        public Func<string, string, bool> Comparer => Utilities.MatchesFile;
        readonly IRootResolver _rootResolver;
        readonly IFileService _service;

        /// <summary>
        /// Constructs a new instance of your type.
        /// </summary>
        /// <param name="rootResolver">Instance used to resolve the root folder of your app.</param>
        /// <param name="service">Underlaying file service implementation.</param>
        public LoadFile(IRootResolver rootResolver, IFileService service)
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
            if (input.Name == "io.file.load.binary")
                input.Value = await _service.LoadBinaryAsync(_rootResolver.AbsolutePath(input.GetEx<string>()));
            else
                input.Value = await _service.LoadAsync(_rootResolver.AbsolutePath(input.GetEx<string>()));
        }
    }
}
