/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.IO;
using System.Linq;
using System.Text;
using Xunit;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.json.tests
{
    /// <summary>
    /// Puts its value into a stream, which is how the tests get hold of one without a file.
    /// </summary>
    [Slot(Name = "test.stream")]
    public class TestStream : ISlot
    {
        public void Signal(ISignaler signaler, Node input)
        {
            var encoding = Encoding.GetEncoding(input.Children.FirstOrDefault(x => x.Name == "encoding")?.GetEx<string>() ?? "utf-8");
            input.Clear();
            input.Value = new MemoryStream(encoding.GetBytes(input.GetEx<string>()));
        }
    }

    public class JsonStreamTests
    {
        [Fact]
        public void Utf8IsTheDefault()
        {
            var lambda = Common.Evaluate("test.stream:\"{\\\"name\\\":\\\"æøå\\\",\\\"age\\\":44}\"\njson2lambda-stream:x:@test.stream");
            var result = lambda.Children.Skip(1).First().Children.ToList();
            Assert.Equal("æøå", result.First(x => x.Name == "name").Value);
            Assert.Equal(44L, result.First(x => x.Name == "age").Value);
        }

        [Theory]
        [InlineData("utf-16")]
        [InlineData("iso-8859-1")]
        public void OtherEncodingsAreConverted(string encoding)
        {
            var lambda = Common.Evaluate("test.stream:\"{\\\"name\\\":\\\"æøå\\\"}\"\n   encoding:" + encoding + "\njson2lambda-stream:x:@test.stream\n   encoding:" + encoding);
            Assert.Equal("æøå", lambda.Children.Skip(1).First().Children.First().Value);
        }

        [Fact]
        public void NoStreamThrows()
        {
            var ex = Assert.Throws<HyperlambdaException>(() => Common.Evaluate("json2lambda-stream:x:@.missing"));
            Assert.Contains("stream", ex.Message);
        }

        [Fact]
        public void ArraysAreSupportedToo()
        {
            var lambda = Common.Evaluate("test.stream:\"[1,2,3]\"\njson2lambda-stream:x:@test.stream");
            Assert.Equal(3, lambda.Children.Skip(1).First().Children.Count());
        }
    }
}
