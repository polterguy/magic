/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System;
using System.IO;
using System.Threading.Tasks;
using System.Linq;
using System.Text;
using Xunit;
using magic.node;
using magic.node.extensions;
using magic.node.extensions.hyperlambda;

namespace magic.lambda.pdf.tests
{
    public class PdfTests
    {
        const string Html = "<html><body><p>Hello World</p></body></html>";

        [Fact]
        public void Html2PdfCreatesPdfDocument()
        {
            var bytes = Common.Pdf(Html);
            Assert.StartsWith("%PDF", Encoding.ASCII.GetString(bytes, 0, 4));
        }

        [Fact]
        public void RoundTripFromBytes()
        {
            var node = new Node("pdf2text", Common.Pdf(Html));
            Common.GetSignaler().Signal("pdf2text", node);
            Assert.Equal("Hello World", node.Value);
        }

        [Fact]
        public void RoundTripFromStream()
        {
            using var stream = new MemoryStream(Common.Pdf(Html));
            var node = new Node("pdf2text", stream);
            Common.GetSignaler().Signal("pdf2text", node);
            Assert.Equal("Hello World", node.Value);
        }

        [Fact]
        public void RoundTripFromFile()
        {
            StubLoadBinary.Content = Common.Pdf(Html);
            var node = new Node("pdf2text", "/files/foo.pdf");
            Common.GetSignaler().Signal("pdf2text", node);
            Assert.Equal("/files/foo.pdf", StubLoadBinary.Requested);
            Assert.Equal("Hello World", node.Value);
        }

        [Fact]
        public void PreservePagesReturnsOneChildPerPage()
        {
            var bytes = Common.Pdf("<html><body><p>First</p><div style=\"page-break-after: always\"></div><p>Second</p></body></html>");
            var node = new Node("pdf2text", bytes);
            node.Add(new Node("preserve-pages", true));
            Common.GetSignaler().Signal("pdf2text", node);
            Assert.Null(node.Value);
            Assert.Equal(2, node.Children.Count());
            Assert.Contains("First", node.Children.First().Value as string);
            Assert.Contains("Second", node.Children.Skip(1).First().Value as string);
        }

        [Fact]
        public void UnsupportedValueTypeIsLeftUntouched()
        {
            var node = new Node("pdf2text", 42);
            Common.GetSignaler().Signal("pdf2text", node);
            Assert.Equal(42, node.Value);
            Assert.Empty(node.Children);
        }

        [Fact]
        public void FileResourcesAreLoadedThroughTheSlot()
        {
            StubLoadBinary.Requested = null;
            StubLoadBinary.Content = Common.Png;
            Common.Pdf("<html><body><img src=\"file:///images/pic.png\"/></body></html>");
            Assert.Equal("/images/pic.png", StubLoadBinary.Requested);
        }

        [Fact]
        public void HttpResourcesAreRetrievedThroughTheSlot()
        {
            StubHttpGet.Requested = null;
            StubHttpGet.Content = Common.Png;
            Common.Pdf("<html><body><img src=\"https://example.test/pic.png\"/></body></html>");
            Assert.Equal("https://example.test/pic.png", StubHttpGet.Requested);
        }

        [Fact]
        public void UnsupportedResourceSchemesDoNotBreakConversion()
        {
            var bytes = Common.Pdf("<html><body><p>ok</p><img src=\"ftp://example.test/pic.png\"/></body></html>");
            Assert.StartsWith("%PDF", Encoding.ASCII.GetString(bytes, 0, 4));
        }

        [Fact]
        public void RetrieverRejectsUnsupportedScheme()
        {
            var retriever = new SignalerResourceRetriever(Common.GetSignaler());
            var ex = Assert.Throws<HyperlambdaException>(() => retriever.GetByteArrayByUrl(new Uri("ftp://example.test/pic.png")));
            Assert.Contains("ftp", ex.Message);
        }

        [Fact]
        public void RetrieverThrowsWhenHttpReturnsNoContent()
        {
            StubHttpGet.OmitContent = true;
            try
            {
                var retriever = new SignalerResourceRetriever(Common.GetSignaler());
                var ex = Assert.Throws<HyperlambdaException>(() => retriever.GetByteArrayByUrl(new Uri("https://example.test/pic.png")));
                Assert.Contains("got no content", ex.Message);
            }
            finally
            {
                StubHttpGet.OmitContent = false;
            }
        }

        [Fact]
        public void RetrieverReturnsBytesAndStreamsForFileAndHttp()
        {
            var retriever = new SignalerResourceRetriever(Common.GetSignaler());
            StubLoadBinary.Content = Common.Png;
            StubHttpGet.Content = Common.Png;
            Assert.Equal(Common.Png, retriever.GetByteArrayByUrl(new Uri("file:///images/pic.png")));
            Assert.Equal(Common.Png, retriever.GetByteArrayByUrl(new Uri("http://example.test/pic.png")));
            using var stream = retriever.GetInputStreamByUrl(new Uri("https://example.test/pic.png"));
            Assert.Equal(Common.Png.Length, stream.Length);
        }

        static async Task EvaluateWhitelisted(string vocabulary, string lambda)
        {
            var hl = "whitelist\n   vocabulary\n" + vocabulary + "   .lambda\n" + lambda;
            await Common.GetSignaler().SignalAsync("eval", HyperlambdaParser.Parse(hl));
        }

        [Fact]
        public async Task WhitelistWithoutFileLoadBlocksPdf2TextFile()
        {
            StubLoadBinary.Content = Common.Pdf(Html);
            StubLoadBinary.Requested = null;
            await Assert.ThrowsAnyAsync<Exception>(
                () => EvaluateWhitelisted("      pdf2text\n", "      pdf2text:/files/foo.pdf\n"));
            Assert.Null(StubLoadBinary.Requested);
        }

        [Fact]
        public async Task WhitelistWithFileLoadAllowsPdf2TextFile()
        {
            StubLoadBinary.Content = Common.Pdf(Html);
            StubLoadBinary.Requested = null;
            await EvaluateWhitelisted("      pdf2text\n      io.file.load.binary\n", "      pdf2text:/files/foo.pdf\n");
            Assert.Equal("/files/foo.pdf", StubLoadBinary.Requested);
        }

        [Fact]
        public async Task WhitelistWithoutHttpGetBlocksHtml2PdfResources()
        {
            StubHttpGet.Content = Common.Png;
            StubHttpGet.Requested = null;
            await EvaluateWhitelisted("      html2pdf\n", "      html2pdf:@\"<img src=\"\"https://example.test/pic.png\"\"/>\"\n");
            Assert.Null(StubHttpGet.Requested);
        }

        [Fact]
        public async Task WhitelistWithHttpGetAllowsHtml2PdfResources()
        {
            StubHttpGet.Content = Common.Png;
            StubHttpGet.Requested = null;
            await EvaluateWhitelisted("      html2pdf\n      http.get\n", "      html2pdf:@\"<img src=\"\"https://example.test/pic.png\"\"/>\"\n");
            Assert.Equal("https://example.test/pic.png", StubHttpGet.Requested);
        }

        [Fact]
        public void PageWithUnreadableContentIsSkipped()
        {
            // A page whose content stream claims to be Flate compressed but is not, which cannot be read.
            using var memory = new MemoryStream();
            using (var writer = new iText.Kernel.Pdf.PdfWriter(memory))
            {
                writer.SetCloseStream(false);
                using var doc = new iText.Kernel.Pdf.PdfDocument(writer);
                var page = doc.AddNewPage();
                var broken = new iText.Kernel.Pdf.PdfStream(Encoding.ASCII.GetBytes("this is not deflate data"));
                broken.Put(iText.Kernel.Pdf.PdfName.Filter, iText.Kernel.Pdf.PdfName.FlateDecode);
                page.GetPdfObject().Put(iText.Kernel.Pdf.PdfName.Contents, broken);
            }
            var node = new Node("pdf2text", memory.ToArray());
            Common.GetSignaler().Signal("pdf2text", node);
            Assert.Equal("", node.Value);
        }
    }
}
