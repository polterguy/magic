/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.IO;
using System.Linq;
using System.Text;
using Xunit;
using magic.node;

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
    }
}
