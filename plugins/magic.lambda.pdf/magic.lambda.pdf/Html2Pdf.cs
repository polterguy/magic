/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.IO;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using iText.Html2pdf;

namespace magic.lambda.pdf
{
    /// <summary>
    /// [html2pdf] slot for converting HTML to PDF.
    /// </summary>
    [Slot(
        Name = "html2pdf",
        Description = "Converts HTML into a PDF document",
        ValueKind = "html",
        ValueDescription = "HTML markup to convert",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "pdf-content,binary-content",
        ReturnsDescription = "Resolves to the generated PDF bytes")]
    public class Html2Pdf : ISlot
    {
        /// <summary>
        /// Implementation of your slot.
        /// </summary>
        /// <param name="signaler">Signaler used to signal your slot.</param>
        /// <param name="input">Arguments to your slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var html = input.GetEx<string>();

            /*
             * Routing every resource (image, stylesheet, font) the document references through a
             * retriever that dispatches to [io.file.load.binary] and [http.get] - rather than letting
             * iText read files and issue HTTP requests on its own, entirely outside the whitelist.
             */
            var properties = new ConverterProperties();
            properties.SetResourceRetriever(new SignalerResourceRetriever(signaler));

            using (var stream = new MemoryStream())
            {
                HtmlConverter.ConvertToPdf(html, stream, properties);
                input.Clear();
                input.Value = stream.ToArray();
            }
        }
    }
}
