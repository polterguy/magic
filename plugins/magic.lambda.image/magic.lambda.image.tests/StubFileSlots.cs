/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.IO;
using System.Linq;
using System.Collections.Concurrent;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.image.tests
{
    /*
     * Files the stand-in slots below read and write, keyed by path, so that the image slots can be tested
     * without the io plugin. Every test uses paths of its own, since tests run in parallel.
     */
    public static class StubFiles
    {
        public static readonly ConcurrentDictionary<string, byte[]> Files = new();
    }

    /*
     * Stand-in for the io plugin's slot, which the image slots use to save a stream to a file.
     */
    [Slot(Name = "io.stream.save-file")]
    public class StubSaveFile : ISlot
    {
        public void Signal(ISignaler signaler, Node input)
        {
            var source = (Stream)input.Children.First().Value;
            using (var copy = new MemoryStream())
            {
                source.CopyTo(copy);
                StubFiles.Files[input.GetEx<string>()] = copy.ToArray();
            }
        }
    }

    /*
     * Stand-in for the io plugin's slot, which the image slots use to open a file as a stream.
     */
    [Slot(Name = "io.stream.open-file")]
    public class StubOpenFile : ISlot
    {
        public void Signal(ISignaler signaler, Node input)
        {
            input.Value = new MemoryStream(StubFiles.Files[input.GetEx<string>()]);
        }
    }
}
