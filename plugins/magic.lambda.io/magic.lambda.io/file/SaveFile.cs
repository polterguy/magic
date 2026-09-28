/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Threading.Tasks;
using magic.node;
using magic.node.contracts;
using magic.node.extensions;
using magic.signals.contracts;
using magic.lambda.io.helpers;

namespace magic.lambda.io.file
{
    /// <summary>
    /// [io.file.save] slot for saving a file on your server.
    /// </summary>
    [Slot(
        Name = "save-file",
        Description = "Saves a text file to the server",
        ValueKind = "file-path",
        ValueDescription = "File path to save",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.None,
        SignatureType = typeof(global::magic.lambda.io.signatures.TextFileSaveSignature))]
    [Slot(
        Name = "io.file.save",
        Description = "Saves a text file to the server",
        ValueKind = "file-path",
        ValueDescription = "File path to save",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.None,
        SignatureType = typeof(global::magic.lambda.io.signatures.TextFileSaveSignature))]
    [Slot(
        Name = "io.file.save.binary",
        Description = "Saves a binary file to the server",
        ValueKind = "binary-file",
        ValueDescription = "File path to save",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.None,
        SignatureType = typeof(global::magic.lambda.io.signatures.BinaryFileSaveSignature))]
    public class SaveFile : ISlotAsync, IWhitelistComparer
    {

        /// <inheritdoc />
        public Func<string, string, bool> Comparer => Utilities.MatchesPath;
        readonly IRootResolver _rootResolver;
        readonly IFileService _service;

        /// <summary>
        /// Constructs a new instance of your type.
        /// </summary>
        /// <param name="rootResolver">Instance used to resolve the root folder of your app.</param>
        /// <param name="service">Underlaying file service implementation.</param>
        public SaveFile(IRootResolver rootResolver, IFileService service)
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
            // Making sure we evaluate any children, to make sure any signals wanting to retrieve our source is evaluated.
            await signaler.SignalAsync("eval", input, skipWhitelist: true);

            // Saving file.
            switch (input.Name)
            {
                // Text content.
                case "save-file":
                case "io.file.save":
                    var strArgs = GetArgs<string>(input);
                    await _service.SaveAsync(strArgs.Path, strArgs.Content);
                    break;

                // Binary content.
                case "io.file.save.binary":
                    var byteArgs = GetArgs<byte[]>(input);
                    await _service.SaveAsync(byteArgs.Path, byteArgs.Content);
                    break;

                default:
                    throw new HyperlambdaException("You shouldn't be here ...??");
            }
        }

        #region [ -- Private helper methods -- ]

        /*
         * Retrieves the arguments as supplied to slot invocation.
         */
        (string Path, T Content) GetArgs<T>(Node input)
        {
            return (_rootResolver.AbsolutePath(input.GetEx<string>()), input.Children.First().GetEx<T>());
        }

        #endregion
    }
}
