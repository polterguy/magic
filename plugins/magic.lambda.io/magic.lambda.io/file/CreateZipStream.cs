/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.IO;
using System.Linq;
using System.IO.Compression;
using System.Threading.Tasks;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.io.file
{
    /// <summary>
    /// [io.content.zip-stream] slot for zipping a bunch of files into a specified stream.
    /// </summary>
    [Slot(Name = "io.content.zip-stream")]
    public class ZipContent : ISlotAsync
    {
        /// <summary>
        /// Implementation of slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise the signal.</param>
        /// <param name="input">Arguments to slot.</param>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            // Evaluating all filenames, in case they're slot invocations.
            await signaler.SignalAsync("eval", input);

            // Notice, this stream is returned to caller, and never disposed - Which is its entire purpose!
            var result = new MemoryStream();

            /*
             * Creating our ZIP archive, notice the boolean true allowing us to keep MemoryStream open
             * after disposing ZIP stream. This is needed since ZipArchive writes the last bytes to the ZIP file
             * only once it's actually disposed.
             */
            using (var archive = new ZipArchive(result, ZipArchiveMode.Create, true))
            {
                // Iterating through each entity caller wants to zip, and creating entry for item.
                foreach (var idx in input.Children)
                {
                    // Evaluating content node, in case it's a slot invocation.
                    await signaler.SignalAsync("eval", idx);

                    // Creating currently iterated ZIP entry and opening stream to write to it.
                    var entry = archive.CreateEntry(idx.GetEx<string>());
                    using (var entryStream = entry.Open())
                    {
                        // Figuring out content type of current entry (byte[] or string), and sanity checking invocation.
                        var content = (idx.Children.FirstOrDefault()?.GetEx<object>()) ??
                            throw new HyperlambdaException($"Empty entry for ZIP file found, name was '{entry.FullName}'");

                        // Correctly persisting currently iterated entry according to its type.
                        if (content is byte[] bytesContent)
                        {
                            // Byte array content.
                            await entryStream.WriteAsync(bytesContent);
                            await entryStream.FlushAsync();
                        }
                        else if (content is string stringContent)
                        {
                            // String content.
                            using (var writer = new StreamWriter(entryStream))
                            {
                                await writer.WriteAsync(stringContent);
                            }
                        }
                        else
                        {
                            // Oops, we only support string or byte[] content ...
                            throw new HyperlambdaException("[io.content.zip-stream] can only handle string and byte[] content");
                        }
                    }
                }
            }

            // Important! Such that caller can use stream directly, read from it, copy it, etc - Without having to fiddle with it first.
            result.Position = 0;
            input.Value = result;
        }
    }
}
