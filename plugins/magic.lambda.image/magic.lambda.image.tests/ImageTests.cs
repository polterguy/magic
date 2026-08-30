/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Xunit;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.image.tests
{
    public class ImageTests
    {
        [Fact]
        public void GenerateQrCode()
        {
            var lambda = Common.Evaluate("image.generate-qr:foo-bar\r\n   size:4");
            Assert.True(lambda.Children.First().Value is Stream);
            var stream = lambda.Children.First().Value as Stream;
            Assert.True(stream.Length > 5);
        }

        [Fact]
        public void GenerateQrCodeNoSize()
        {
            var lambda1 = Common.Evaluate("image.generate-qr:foo-bar");
            var stream1 = lambda1.Children.First().Value as Stream;

            var lambda2 = Common.Evaluate("image.generate-qr:foo-bar\r\n   size:4");
            Assert.True(lambda2.Children.First().Value is Stream);
            var stream2 = lambda2.Children.First().Value as Stream;
            Assert.Equal(stream1.Length, stream2.Length);
        }

        [Fact]
        public void ImageConvertSignatureDocumentsStreamOutputAndOptions()
        {
            var lambda = Common.Evaluate(@"slot.signature:image.convert");
            var result = lambda.Children.First();
            var children = result.Children.First(x => x.Name == "children");
            var output = result.Children.First(x => x.Name == "output");

            Assert.Contains(children.Children, x => x.Name == "type");
            Assert.Contains(children.Children, x => x.Name == "dest");
            Assert.Equal(SlotReturnsMode.Both.ToString(), output.Children.First(x => x.Name == "mode").GetEx<string>());
            Assert.Equal("image", output.Children.First(x => x.Name == "kind").GetEx<string>());
            Assert.Equal("Resolves to the converted image stream unless [dest] is supplied, in which case the converted image is saved to disk and nothing is returned", output.Children.First(x => x.Name == "description").GetEx<string>());
        }

        [Fact]
        public void ImageResizeSignatureDocumentsStreamOutputAndOptions()
        {
            var lambda = Common.Evaluate(@"slot.signature:image.resize");
            var result = lambda.Children.First();
            var children = result.Children.First(x => x.Name == "children");
            var output = result.Children.First(x => x.Name == "output");

            Assert.Contains(children.Children, x => x.Name == "type");
            Assert.Contains(children.Children, x => x.Name == "dest");
            Assert.Contains(children.Children, x => x.Name == "width");
            Assert.Contains(children.Children, x => x.Name == "height");
            Assert.Equal("image", output.Children.First(x => x.Name == "kind").GetEx<string>());
        }

        [Fact]
        public void ImageSizeSignatureDocumentsDimensionChildren()
        {
            var lambda = Common.Evaluate(@"slot.signature:image.size");
            var output = lambda.Children.First().Children.First(x => x.Name == "output");

            Assert.Equal(SlotReturnsMode.Lambda.ToString(), output.Children.First(x => x.Name == "mode").GetEx<string>());
            Assert.Equal("Returns [width:int] and [height:int] child nodes for the image dimensions", output.Children.First(x => x.Name == "description").GetEx<string>());
        }
    }
}
