/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
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
    [Slot(
        Name = "image.generate-qr",
        Description = "Renders the supplied text or URL into a PNG QR code; commonly used for links and payment codes",
        ValueKind = "qr-content,url,text",
        ValueDescription = "Text or URL to encode in the QR code",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "image,binary-content",
        ReturnsDescription = "Resolves to the generated QR code image bytes",
        SignatureType = typeof(global::magic.lambda.image.signatures.QrSignature))]
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
                    /*
                     * The size is pixels per module, so the image's width is the module count (quiet zone
                     * included) times size. Checked as a long, since a huge size would overflow an int.
                     */
                    var side = (long)qrData.ModuleMatrix.Count * size;
                    if (size < 1 || side > Utilities.MaxDimension)
                        throw new HyperlambdaException($"[size] of {size} must be at least 1, and render a QR code at most {Utilities.MaxDimension} pixels wide, but it would be {side}");
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
