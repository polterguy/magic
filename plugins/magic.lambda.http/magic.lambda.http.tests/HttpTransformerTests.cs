/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Xunit;
using magic.node;
using magic.node.extensions;

namespace magic.lambda.http.tests
{
    /*
     * Tests how responses are converted to lambda objects, and how payloads are converted to request bodies,
     * which is decided by their Content-Type, using a fake server that says whatever the test wants it to.
     */
    public class HttpTransformerTests
    {
        static async Task<Node> RespondAsync(string body, string contentType, string charset = null, byte[] bytes = null)
        {
            var lambda = await Common.EvaluateAsync(@"
http.get:""https://example.com/endpoint""
   convert:true", (_, _) =>
            {
                var content = bytes != null ? new ByteArrayContent(bytes) : new StringContent(body ?? "", Encoding.UTF8);
                content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(contentType) { CharSet = charset };
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK) { Content = content });
            });
            return lambda.Children.First();
        }

        static Node Content(Node response) => response.Children.First(x => x.Name == "content");

        static async Task<(string Body, string ContentType)> SendAsync(string payloadHl, string contentType = null, string verb = "post")
        {
            string body = null;
            string type = null;
            await Common.EvaluateAsync(
                "http." + verb + ":\"https://example.com/endpoint\"\n" +
                (contentType == null ? "" : "   headers\n      Content-Type:" + contentType + "\n") +
                payloadHl,
                async (request, _) =>
                {
                    body = request.Content == null ? null : await request.Content.ReadAsStringAsync();
                    type = request.Content?.Headers.ContentType?.MediaType;
                    return new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent("") };
                });
            return (body, type);
        }

        #region [ -- Responses -- ]

        [Fact]
        public async Task JsonObject()
        {
            var content = Content(await RespondAsync("{\"name\":\"Ada\",\"tags\":[1,2]}", "application/json"));
            Assert.Equal("Ada", content.Children.First(x => x.Name == "name").Value);
            Assert.Equal(2, content.Children.First(x => x.Name == "tags").Children.Count());
        }

        [Fact]
        public async Task JsonArrayWithByteOrderMarkAndLeadingWhitespace()
        {
            var bytes = new byte[] { 0xEF, 0xBB, 0xBF }.Concat(Encoding.UTF8.GetBytes("  \r\n\t[1,2,3]")).ToArray();
            var content = Content(await RespondAsync(null, "application/json", bytes: bytes));
            Assert.Equal(3, content.Children.Count());
        }

        [Theory]
        [InlineData("utf-8")]
        [InlineData("\"utf-8\"")]
        [InlineData("UTF-8")]
        public async Task Utf8CharsetIsParsedDirectlyFromTheBytes(string charset)
        {
            var response = await RespondAsync("{\"a\":1}", "application/json", charset);
            Assert.Equal(1L, Content(response).Children.First().Value);
        }

        [Fact]
        public async Task OtherCharsetsGoThroughText()
        {
            var response = await RespondAsync("{\"a\":\"æ\"}", "application/json", "utf-16");
            Assert.NotNull(Content(response));
        }

        [Fact]
        public async Task EmptyJsonBody()
        {
            var content = Content(await RespondAsync("", "application/json"));
            Assert.Empty(content.Children);
            Assert.Null(content.Value);
        }

        [Fact]
        public async Task JsonThatIsAStringOrANumber()
        {
            Assert.Equal("just text", Content(await RespondAsync("\"just text\"", "application/json")).Value);
            Assert.Equal("42", Content(await RespondAsync("42", "application/json")).Value);
            Assert.Equal("true", Content(await RespondAsync(" true ", "application/json")).Value);
        }

        [Fact]
        public async Task InvalidJsonIsKeptAsText()
        {
            Assert.Equal("{not json", Content(await RespondAsync("{not json", "application/json")).Value);
            Assert.Equal("{\"a\":1} // a comment", Content(await RespondAsync("{\"a\":1} // a comment", "application/json")).Value);
            Assert.Equal("oops", Content(await RespondAsync("oops", "application/json")).Value);
        }

        [Fact]
        public async Task XJsonIsJsonToo()
        {
            var content = Content(await RespondAsync("{\"a\":1}", "application/x-json"));
            Assert.Equal(1L, content.Children.First().Value);
        }

        [Theory]
        [InlineData("application/hyperlambda")]
        [InlineData("application/x-hyperlambda")]
        public async Task HyperlambdaBecomesALambda(string contentType)
        {
            var content = Content(await RespondAsync("foo:bar\nhowdy\n   world:int:5", contentType));
            Assert.Equal("bar", content.Children.First(x => x.Name == "foo").Value);
            Assert.Equal(5, content.Children.First(x => x.Name == "howdy").Children.First().Value);
        }

        [Fact]
        public async Task EmptyHyperlambdaBody()
        {
            Assert.Empty(Content(await RespondAsync("", "application/hyperlambda")).Children);
        }

        [Theory]
        [InlineData("application/www-form-urlencoded")]
        [InlineData("application/x-www-form-urlencoded")]
        public async Task UrlEncodedBecomesNamedNodes(string contentType)
        {
            var content = Content(await RespondAsync("name=Ada+Lovelace&city=K%C3%B8benhavn&flag&empty=", contentType));
            var nodes = content.Children.ToDictionary(x => x.Name, x => x.Value);
            Assert.Equal("Ada Lovelace", nodes["name"]);
            Assert.Equal("København", nodes["city"]);
            Assert.Null(nodes["flag"]);
            Assert.Equal("", nodes["empty"]);
        }

        [Fact]
        public async Task TextIsReturnedAsText()
        {
            Assert.Equal("plain text", Content(await RespondAsync("plain text", "text/plain")).Value);
        }

        [Fact]
        public async Task OtherTypesAreReturnedAsBytes()
        {
            var content = Content(await RespondAsync(null, "application/octet-stream", bytes: new byte[] { 1, 2, 3 }));
            Assert.Equal(new byte[] { 1, 2, 3 }, content.Value);
        }

        #endregion

        #region [ -- Requests -- ]

        [Fact]
        public async Task LambdaPayloadIsJsonByDefault()
        {
            var (body, type) = await SendAsync("   payload\n      name:Ada\n      age:int:36");
            Assert.Equal("application/json", type);
            Assert.Equal("{\"name\":\"Ada\",\"age\":36}", body);
        }

        [Fact]
        public async Task ExpressionsInAJsonPayloadAreResolved()
        {
            var lambda = "   payload\n      name:x:@.name\n";
            string body = null;
            await Common.EvaluateAsync(".name:Ada\nhttp.post:\"https://example.com/endpoint\"\n" + lambda, async (request, _) =>
            {
                body = await request.Content.ReadAsStringAsync();
                return new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent("") };
            });
            Assert.Equal("{\"name\":\"Ada\"}", body);
        }

        [Fact]
        public async Task EmptyPayloadGivesAnEmptyBody()
        {
            var (body, _) = await SendAsync("   payload");
            Assert.Equal("", body);
        }

        [Fact]
        public async Task XJsonPayloadIsJsonToo()
        {
            var (body, type) = await SendAsync("   payload\n      a:int:1", "application/x-json");
            Assert.Equal("application/x-json", type);
            Assert.Equal("{\"a\":1}", body);
        }

        [Theory]
        [InlineData("application/hyperlambda")]
        [InlineData("application/x-hyperlambda")]
        public async Task HyperlambdaPayload(string contentType)
        {
            var (body, type) = await SendAsync("   payload\n      foo:bar\n      howdy:int:5", contentType);
            Assert.Equal(contentType, type);
            Assert.Equal("foo:bar\r\nhowdy:int:5".Replace("\r\n", "\n"), body.Replace("\r\n", "\n").Trim());
        }

        [Theory]
        [InlineData("application/www-form-urlencoded")]
        [InlineData("application/x-www-form-urlencoded")]
        public async Task UrlEncodedPayload(string contentType)
        {
            var (body, _) = await SendAsync("   payload\n      name:Ada Lovelace\n      city:København & co", contentType);
            Assert.Equal("name=Ada+Lovelace&city=K%c3%b8benhavn+%26+co", body);
        }

        [Fact]
        public async Task UrlEncodedPayloadCannotBeNested()
        {
            var ex = await Assert.ThrowsAsync<HyperlambdaException>(() =>
                SendAsync("   payload\n      outer\n         inner:x", "application/x-www-form-urlencoded"));
            Assert.Contains("outer", ex.Message);
        }

        [Theory]
        [InlineData("put")]
        [InlineData("post")]
        public async Task BodiesAreSentWithBothVerbs(string verb)
        {
            var (body, _) = await SendAsync("   payload\n      a:int:1", null, verb);
            Assert.Equal("{\"a\":1}", body);
        }

        #endregion
    }
}
