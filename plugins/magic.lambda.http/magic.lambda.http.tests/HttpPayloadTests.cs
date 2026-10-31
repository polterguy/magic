/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using MimeKit;
using Xunit;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.http.tests
{
    /*
     * Stand-in for the mime plugin's slot, which the http slots use to turn a multipart payload into a MIME entity.
     */
    [Slot(Name = ".mime.create")]
    public class StubMimeCreate : ISlot
    {
        public void Signal(ISignaler signaler, Node input)
        {
            input.Value = new TextPart("plain") { Text = "hello from the entity" };
        }
    }

    /*
     * How a [payload] becomes the body of a request: a multipart payload is built as a MIME entity, whose own headers
     * replace the content type, and values given as expressions are resolved first.
     */
    public class HttpPayloadTests
    {
        static async Task<(string Body, string ContentType)> PostAsync(string hl)
        {
            string body = null;
            string type = null;
            await Common.EvaluateAsync(hl, async (request, ct) =>
            {
                body = request.Content == null ? null : await request.Content.ReadAsStringAsync(ct);
                type = request.Content?.Headers.ContentType?.MediaType;
                return new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent("") };
            });
            return (body, type);
        }

        [Fact]
        public async Task MultipartPayloadIsSentAsTheMimeEntity()
        {
            var (body, type) = await PostAsync(@"
http.post:""https://example.com/endpoint""
   headers
      Content-Type:multipart/form-data
   payload
      field:value");
            Assert.Contains("hello from the entity", body);
            Assert.Equal("text/plain", type);
        }

        [Fact]
        public async Task ExpressionsInAPayloadAreResolvedBeforeItIsSent()
        {
            var (body, _) = await PostAsync(@"
.items
   a:int:1
http.post:""https://example.com/endpoint""
   headers
      Content-Type:application/json
   payload
      outer
         inner:x:@.items/*");
            Assert.Equal("{\"outer\":{\"inner\":1}}", body);
        }

        [Fact]
        public async Task AnExpressionWithSeveralSourcesIsRejected()
        {
            var exception = await Assert.ThrowsAsync<HyperlambdaException>(() => PostAsync(@"
.items
   a:1
   b:2
http.post:""https://example.com/endpoint""
   headers
      Content-Type:application/json
   payload
      foo:x:@.items/*"));
            Assert.Equal("Multiple sources found for node in lambda object supplied to [http.post]", exception.Message);
        }
    }
}
