/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Text;
using System.Threading.Tasks;
using magic.node;
using magic.node.contracts;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.io.file
{
    /// <summary>
    /// [io.file.load-recursively] slot for loading a file on your server.
    /// </summary>
    [Slot(Name = "io.file.load-recursively")]
    public class LoadFileRecursively : ISlotAsync
    {
        readonly IRootResolver _rootResolver;
        readonly IFileService _service;

        /// <summary>
        /// Constructs a new instance of your type.
        /// </summary>
        /// <param name="rootResolver">Instance used to resolve the root folder of your app.</param>
        /// <param name="service">Underlaying file service implementation.</param>
        public LoadFileRecursively(IRootResolver rootResolver, IFileService service)
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
            input.Clear();
            foreach (var idx in await _service.LoadAllAsync(_rootResolver.AbsolutePath(input.GetEx<string>()), null))
            {
                var idxNode = new Node(".");
                idxNode.Add(new Node("name", _rootResolver.RelativePath(idx.Filename)));
                idxNode.Add(new Node("content", Encoding.UTF8.GetString(idx.Content)));
                input.Add(idxNode);
            }
            input.Value = null;
        }
    }
}
