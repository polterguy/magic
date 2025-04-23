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
    }
}
