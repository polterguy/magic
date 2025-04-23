/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.IO;
using System.Linq;
using QRCoder;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.image.slots
{
    /// <summary>
    /// [image.generate-qr] slot for creating QR codes.
    /// </summary>
    [Slot(Name = "image.generate-qr")]
    public class GenerateQr : ISlot
    {
        /// <summary>
        /// Slot implementation.
        /// </summary>
        /// <param name="signaler">Signaler that raised the signal.</param>
        /// <param name="input">Arguments to slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var data = input.GetEx<string>();
            var size = input.Children.FirstOrDefault(x => x.Name == "size")?.GetEx<int>() ?? 4;
            using (var generator = new QRCodeGenerator())
            {
                using (var qrData = generator.CreateQrCode(data, QRCodeGenerator.ECCLevel.Q))
                {
                    using (var code = new PngByteQRCode(qrData))
                    {
                        // Intentionally NOT disposing stream, it's anyways a MemoryStream
                        var bytes = code.GetGraphic(size);

                        // Notice, we are NOT disposing stream, but simply returning it as a stream to caller.
                        var stream = new MemoryStream();
                        stream.Write(bytes, 0, bytes.Length);
                        stream.Flush();
                        stream.Position = 0;
                        input.Value = stream;
                    }
                }
            }
        }
    }
}
