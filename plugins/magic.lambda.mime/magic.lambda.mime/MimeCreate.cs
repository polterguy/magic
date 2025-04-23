/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.IO;
using System.Linq;
using System.Threading.Tasks;
using magic.node;
using magic.node.contracts;
using magic.node.extensions;
using magic.signals.contracts;
using magic.lambda.mime.helpers;

namespace magic.lambda.mime
{
    /// <summary>
    /// Creates a MIME message and returns it as a MIME message to caller.
    /// </summary>
    [Slot(Name = "mime.create")]
    public class MimeCreate : ISlotAsync
    {
        readonly IStreamService _streamService;
        readonly IRootResolver _rootResolver;

        /// <summary>
        /// Creates an instance of your type.
        /// </summary>
        /// <param name="streamService">Needed in case MIME creator needs to create entities from file service</param>
        /// <param name="rootResolver">Needed to resolve root folder</param>
        public MimeCreate(IStreamService streamService, IRootResolver rootResolver)
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
            // Figuring out if caller wants a structured result.
            var structured = input.Children
                .FirstOrDefault(x => x.Name == "structured")?
                .GetEx<bool>() ?? false;

            // Creating entity.
            using (var entity = await MimeCreator.CreateAsync(signaler, input, _streamService, _rootResolver))
            {
                // House cleaning.
                input.Value = null;
                input.Clear();

                // Serialising entity into temporary stream such that we can correctly return it to caller.
                using (var stream = new MemoryStream())
                {
                    await entity.WriteToAsync(stream, structured);
                    stream.Position = 0;

                    // Reading back entity's content again.
                    using (var reader = new StreamReader(stream))
                    {
                        // Checking if caller wants a structured result or not.
                        if (structured)
                        {
                            input.AddRange(entity.Headers.Select(x => new Node(x.Field, x.Value)));
                            input.Add(new Node("content", reader.ReadToEnd()));
                        }
                        else
                        {
                            input.Value = await reader.ReadToEndAsync();
                        }
                    }
                }
            }
        }
    }
}
