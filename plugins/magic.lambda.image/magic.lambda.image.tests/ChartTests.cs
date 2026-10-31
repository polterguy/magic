/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.IO;
using System.Linq;
using Xunit;
using magic.node.extensions;

namespace magic.lambda.image.tests
{
    public class ChartTests
    {
        static readonly byte[] PngSignature = { 0x89, 0x50, 0x4E, 0x47 };

        const string StackedAndGroupedData = @"
   legend
      .:Foo
      .:Bar
   bars
      Q1
         .:int:3
         .:int:4
      Q2
         .:int:5
         .:int:6";

        static void AssertPng(byte[] bytes)
        {
            Assert.True(bytes.Length > 100);
            Assert.Equal(PngSignature, bytes.Take(4));
        }

        static byte[] Render(string hl)
        {
            var stream = Common.Evaluate(hl).Children.First().Value as MemoryStream;
            Assert.NotNull(stream);
            return stream.ToArray();
        }

        [Fact]
        public void BarsChartRendersPng()
        {
            AssertPng(Render(@"image.chart:bars
   width:int:400
   height:int:300
   bars
      a:int:10
      b:int:20
      c:int:15"));
        }

        [Fact]
        public void StackedChartRendersPng()
        {
            AssertPng(Render("image.chart:stacked\r\n   width:int:400\r\n   height:int:300" + StackedAndGroupedData));
        }

        [Fact]
        public void GroupedChartRendersPng()
        {
            AssertPng(Render("image.chart:grouped\r\n   width:int:400\r\n   height:int:300" + StackedAndGroupedData));
        }

        [Fact]
        public void ChartIsSavedToFileWhenFilenameIsGiven()
        {
            var lambda = Common.Evaluate(@"image.chart:bars
   width:int:400
   height:int:300
   filename:/charts/saved.png
   bars
      a:int:10
      b:int:20");
            Assert.Null(lambda.Children.First().Value);
            AssertPng(StubFiles.Files["/charts/saved.png"]);
        }

        [Theory]
        [InlineData("image.chart:bars\r\n   height:int:300\r\n   bars\r\n      a:int:1", "No [width] provided to [image.chart]")]
        [InlineData("image.chart:bars\r\n   width:int:400\r\n   bars\r\n      a:int:1", "No [height] provided to [image.chart]")]
        [InlineData("image.chart:bars\r\n   width:int:400\r\n   height:int:300", "No [bars] provided to [image.chart]")]
        [InlineData("image.chart:pie\r\n   width:int:400\r\n   height:int:300", "[image.chart] does not support charts of type 'pie'")]
        [InlineData("image.chart:stacked\r\n   width:int:400\r\n   height:int:300\r\n   legend\r\n      .:Foo", "No [bars] provided to [image.chart]")]
        [InlineData("image.chart:stacked\r\n   width:int:400\r\n   height:int:300\r\n   bars\r\n      Q1\r\n         .:int:1", "No [legend] provided to [image.chart]")]
        [InlineData("image.chart:grouped\r\n   width:int:400\r\n   height:int:300\r\n   legend\r\n      .:Foo", "No [bars] provided to [image.chart]")]
        [InlineData("image.chart:grouped\r\n   width:int:400\r\n   height:int:300\r\n   bars\r\n      Q1\r\n         .:int:1", "No [legend] provided to [image.chart]")]
        public void InvalidChartArgumentsAreRejected(string hl, string message)
        {
            var exception = Assert.ThrowsAny<System.Exception>(() => Common.Evaluate(hl));
            var inner = exception is System.AggregateException aggregate ? aggregate.InnerException : exception;
            Assert.IsType<HyperlambdaException>(inner);
            Assert.Equal(message, inner.Message);
        }
    }
}
