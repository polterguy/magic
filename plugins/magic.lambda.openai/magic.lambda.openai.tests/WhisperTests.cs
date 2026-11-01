/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Xunit;
using magic.node;
using magic.node.extensions;

namespace magic.lambda.openai.tests
{
    public class WhisperTests
    {
        sealed class FakeHandler : HttpMessageHandler
        {
            readonly HttpStatusCode _status;
            readonly string _body;

            public FakeHandler(HttpStatusCode status, string body)
            {
                _status = status;
                _body = body;
            }

            public HttpRequestMessage Request { get; private set; }

            public string RequestBody { get; private set; }

            protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            {
                Request = request;
                RequestBody = await request.Content.ReadAsStringAsync(cancellationToken);
                return new HttpResponseMessage(_status) { Content = new StringContent(_body) };
            }
        }

        static Node Args(bool key = true, bool content = true, bool type = true, string language = null)
        {
            var node = new Node("openai.whisper");
            if (key)
                node.Add(new Node("key", "sk-test"));
            if (content)
                node.Add(new Node("content", new byte[] { 1, 2, 3 }));
            if (type)
                node.Add(new Node("type", "audio/mpeg"));
            if (language != null)
                node.Add(new Node("language", language));
            return node;
        }

        [Fact]
        public async Task TranscribesAudio()
        {
            var handler = new FakeHandler(HttpStatusCode.OK, "{\"text\":\"hello there\"}");
            var node = Args(language: "en");
            await new Whisper(new HttpClient(handler)).SignalAsync(Common.GetSignaler(), node);
            Assert.Equal("hello there", node.Value);
            Assert.Empty(node.Children);
            Assert.Equal("Bearer sk-test", handler.Request.Headers.Authorization.ToString());
            Assert.Equal("https://api.openai.com/v1/audio/transcriptions", handler.Request.RequestUri.ToString());
            Assert.Contains("whisper-1", handler.RequestBody);
            Assert.Contains("name=language", handler.RequestBody);
            Assert.Contains("audio.mpeg", handler.RequestBody);
        }

        [Fact]
        public async Task LanguageIsOptional()
        {
            var handler = new FakeHandler(HttpStatusCode.OK, "{\"text\":\"hi\"}");
            var node = Args();
            await new Whisper(new HttpClient(handler)).SignalAsync(Common.GetSignaler(), node);
            Assert.Equal("hi", node.Value);
            Assert.DoesNotContain("name=language", handler.RequestBody);
        }

        [Fact]
        public async Task FailedRequestThrows()
        {
            var handler = new FakeHandler(HttpStatusCode.Unauthorized, "bad key");
            var ex = await Assert.ThrowsAsync<HyperlambdaException>(
                () => new Whisper(new HttpClient(handler)).SignalAsync(Common.GetSignaler(), Args()));
            Assert.Contains("Unauthorized", ex.Message);
            Assert.Contains("bad key", ex.Message);
        }

        [Fact]
        public async Task MissingKeyThrows()
        {
            await Assert.ThrowsAsync<HyperlambdaException>(
                () => new Whisper(new HttpClient()).SignalAsync(Common.GetSignaler(), Args(key: false)));
        }

        [Fact]
        public async Task MissingContentThrows()
        {
            await Assert.ThrowsAsync<HyperlambdaException>(
                () => new Whisper(new HttpClient()).SignalAsync(Common.GetSignaler(), Args(content: false)));
        }

        [Fact]
        public async Task MissingTypeThrows()
        {
            await Assert.ThrowsAsync<HyperlambdaException>(
                () => new Whisper(new HttpClient()).SignalAsync(Common.GetSignaler(), Args(type: false)));
        }
    }
}
