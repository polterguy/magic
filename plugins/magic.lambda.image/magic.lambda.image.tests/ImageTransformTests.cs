/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using SixLabors.ImageSharp;
using Xunit;
using magic.node;
using magic.node.extensions;

namespace magic.lambda.image.tests
{
    public class ImageTransformTests
    {
        static readonly byte[] PngSignature = { 0x89, 0x50, 0x4E, 0x47 };

        // A small real image, a QR code, since the image slots only transform images that already exist.
        static byte[] Qr()
        {
            var stream = Common.Evaluate("image.generate-qr:foo-bar\r\n   size:4").Children.First().Value as Stream;
            using (var copy = new MemoryStream())
            {
                stream.CopyTo(copy);
                return copy.ToArray();
            }
        }

        static async Task<Node> Run(string slot, object value, params (string Name, object Value)[] arguments)
        {
            var node = new Node(slot, value);
            foreach (var idx in arguments)
            {
                node.Add(new Node(idx.Name, idx.Value));
            }
            await Common.Initialize().SignalAsync(slot, node);
            return node;
        }

        static ImageInfo Identify(object stream)
        {
            return Image.Identify((Stream)stream);
        }

        [Theory]
        [InlineData("png")]
        [InlineData("jpeg")]
        [InlineData("bmp")]
        [InlineData("gif")]
        [InlineData("tga")]
        [InlineData("pbm")]
        [InlineData("tiff")]
        [InlineData("webp")]
        public async Task ConvertWritesEveryFormat(string type)
        {
            var node = await Run("image.convert", new MemoryStream(Qr()), ("type", type));
            Assert.True(((Stream)node.Value).Length > 0);
            Assert.Empty(node.Children);
        }

        [Fact]
        public async Task ConvertDefaultsToPng()
        {
            var node = await Run("image.convert", new MemoryStream(Qr()));
            var bytes = ((MemoryStream)node.Value).ToArray();
            Assert.Equal(PngSignature, bytes.Take(4));
        }

        [Fact]
        public async Task ConvertSavesToDestination()
        {
            await Run("image.convert", new MemoryStream(Qr()), ("type", "bmp"), ("dest", "/converted/qr.bmp"));
            var bytes = StubFiles.Files["/converted/qr.bmp"];
            Assert.Equal(new byte[] { 0x42, 0x4D }, bytes.Take(2));
        }

        [Fact]
        public async Task ConvertOpensImageFromPath()
        {
            StubFiles.Files["/in/convert-source.png"] = Qr();
            var node = await Run("image.convert", "/in/convert-source.png", ("type", "jpeg"));
            var bytes = ((MemoryStream)node.Value).ToArray();
            Assert.Equal(new byte[] { 0xFF, 0xD8 }, bytes.Take(2));
        }

        [Fact]
        public async Task ResizeSetsWidthAndHeight()
        {
            var node = await Run("image.resize", new MemoryStream(Qr()), ("width", 20), ("height", 30));
            var info = Identify(node.Value);
            Assert.Equal(20, info.Width);
            Assert.Equal(30, info.Height);
        }

        [Fact]
        public async Task ResizeKeepsAspectRatioWhenOnlyWidthIsGiven()
        {
            var node = await Run("image.resize", new MemoryStream(Qr()), ("width", 20));
            var info = Identify(node.Value);
            Assert.Equal(20, info.Width);
            Assert.Equal(20, info.Height);
        }

        [Fact]
        public async Task ResizeKeepsAspectRatioWhenOnlyHeightIsGiven()
        {
            var node = await Run("image.resize", new MemoryStream(Qr()), ("height", 24));
            var info = Identify(node.Value);
            Assert.Equal(24, info.Width);
            Assert.Equal(24, info.Height);
        }

        [Fact]
        public async Task ResizeRequiresWidthOrHeight()
        {
            var exception = await Assert.ThrowsAsync<HyperlambdaException>(
                () => Run("image.resize", new MemoryStream(Qr())));
            Assert.Equal("You have to provide either [width], [height] or both to [image.resize]", exception.Message);
        }

        [Fact]
        public async Task CropRemovesTheGivenMargins()
        {
            var original = Image.Identify(new MemoryStream(Qr()));
            var node = await Run("image.crop", new MemoryStream(Qr()), ("left", 2), ("top", 3), ("right", 4), ("bottom", 5));
            var info = Identify(node.Value);
            Assert.Equal(original.Width - 6, info.Width);
            Assert.Equal(original.Height - 8, info.Height);
        }

        [Fact]
        public async Task CropWithoutMarginsKeepsTheSize()
        {
            var original = Image.Identify(new MemoryStream(Qr()));
            var node = await Run("image.crop", new MemoryStream(Qr()));
            var info = Identify(node.Value);
            Assert.Equal(original.Width, info.Width);
            Assert.Equal(original.Height, info.Height);
        }

        [Fact]
        public async Task CropRejectsMarginsWiderThanTheImage()
        {
            var width = Image.Identify(new MemoryStream(Qr())).Width;
            var exception = await Assert.ThrowsAsync<HyperlambdaException>(
                () => Run("image.crop", new MemoryStream(Qr()), ("left", width)));
            Assert.Equal("[left] + [right] is larger than image width", exception.Message);
        }

        [Fact]
        public async Task CropRejectsMarginsTallerThanTheImage()
        {
            var height = Image.Identify(new MemoryStream(Qr())).Height;
            var exception = await Assert.ThrowsAsync<HyperlambdaException>(
                () => Run("image.crop", new MemoryStream(Qr()), ("top", height)));
            Assert.Equal("[top] + [bottom] is larger than image height", exception.Message);
        }

        [Fact]
        public async Task SizeReturnsWidthAndHeight()
        {
            var bytes = Qr();
            var expected = Image.Identify(new MemoryStream(bytes));
            StubFiles.Files["/in/size-source.png"] = bytes;
            var node = await Run("image.size", "/in/size-source.png");
            Assert.Null(node.Value);
            Assert.Equal(expected.Width, node.Children.First(x => x.Name == "width").Get<int>());
            Assert.Equal(expected.Height, node.Children.First(x => x.Name == "height").Get<int>());
        }
    }
}
