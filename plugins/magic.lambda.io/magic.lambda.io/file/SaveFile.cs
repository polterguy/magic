/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Threading.Tasks;
using magic.node;
using magic.node.contracts;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.io.file
{
    /// <summary>
    /// [io.file.save] slot for saving a file on your server.
    /// </summary>
    [Slot(Name = "save-file")]
    [Slot(Name = "io.file.save")]
    [Slot(Name = "io.file.save.binary")]
    public class SaveFile : ISlotAsync
    {
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
            await signaler.SignalAsync("eval", input);

            // Saving file.
            switch (input.Name)
            {
                // Text content.
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
