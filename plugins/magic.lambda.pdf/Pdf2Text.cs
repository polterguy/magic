/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.IO;
using System.Text;
using System.Linq;
using iText.Kernel.Pdf;
using iText.Kernel.Pdf.Canvas.Parser;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.pdf
{
    /// <summary>
    /// [pdf2text] slot for retrieving text content from a PDF file or stream.
    /// </summary>
    [Slot(
        Name = "pdf2text",
        Description = "Extracts text from a PDF file or stream",
        ValueKind = "pdf-file,pdf-content,binary-content",
        ValueDescription = "PDF file path, bytes, or stream to extract text from",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.Both,
        ReturnsKind = "text",
        ReturnsDescription = "Returns extracted text in value or, when preserving pages, one child node per page",
        SignatureType = typeof(global::magic.lambda.pdf.signatures.Pdf2TextSignature))]
    public class Pdf2Text : ISlot
    {
        /// <summary>
        /// Implementation of your slot.
        /// </summary>
        /// <param name="signaler">Signaler used to signal your slot.</param>
        /// <param name="input">Arguments to your slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var value = input.GetEx<object>();
            var preservePages = input.Children.FirstOrDefault(x => x.Name == "preserve-pages")?.GetEx<bool>() ?? false;
            input.Clear();
            if (value is string filename)
                input.Value = ExtractFromFile(signaler, filename, input, preservePages);
            else if (value is Stream stream)
                input.Value = ExtractFromStream(stream, input, preservePages);
            else if (value is byte[] bytes)
                input.Value = ExtractFromBytes(bytes, input, preservePages);
        }

        #region [ -- Private helper methods -- ]

        /*
         * Loads the PDF through [io.file.load.binary] rather than opening it directly, so the
         * read is subject to whatever [whitelist] is in scope - the same convention [http.post]
         * uses for its [filename] argument. The slot throws if the file does not exist.
         */
        static string ExtractFromFile(ISignaler signaler, string filename, Node input, bool preservePages)
        {
            var file = new Node("io.file.load.binary", filename);
            signaler.Signal("io.file.load.binary", file);
            return ExtractFromBytes(file.Get<byte[]>(), input, preservePages);
        }

        /*
         * Reads PDF file from the specified stream.
         */
        static string ExtractFromStream(Stream stream, Node input, bool preservePages)
        {
            using (var reader = new PdfReader(stream))
            {
                return Extract(reader, input, preservePages);
            }
        }

        /*
         * Reads PDF file from the specified bytes.
         */
        static string ExtractFromBytes(byte[] bytes, Node input, bool preservePages)
        {
            using (var stream = new MemoryStream(bytes))
            {
                using (var reader = new PdfReader(stream))
                {
                    return Extract(reader, input, preservePages);
                }
            }
        }

        /*
         * Extracts all text from the specified PdfReader.
         */
        static string Extract(PdfReader reader, Node input, bool preservePages)
        {
            var builder = new StringBuilder();
            using (var doc = new PdfDocument(reader))
            {
                for (var idx = 1; idx <= doc.GetNumberOfPages(); idx++)
                {
                    /*
                     * Sometimes a PDF file will be partically corrupted, which prevents this method from
                     * reading it. For such cases we try our best to read whatever pages we actually can read.
                     */
                    try
                    {
                        var content = PdfTextExtractor.GetTextFromPage(doc.GetPage(idx));
                        var lines = content.Split('\n');
                        foreach (var idxLine in lines)
                        {
                            builder.Append(idxLine.Trim()).Append("\r\n");
                        }
                        if (preservePages)
                        {
                            input.Add(new Node(".", builder.ToString()));
                            builder = new StringBuilder();
                        }
                        else if (lines.Length > 0)
                        {
                            builder.Append("\r\n");
                        }
                    }
                    catch(Exception ex)
                    {
                        Console.WriteLine(ex.Message);
                    }
                }
            }
            return preservePages ? null : builder.ToString().Trim();
        }

        #endregion
    }
}
