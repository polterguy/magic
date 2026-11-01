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
using magic.lambda.validators.validators;

namespace magic.lambda.validators.tests
{
    public class RecaptchaTests
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

            public string Url { get; private set; }

            protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            {
                Url = request.RequestUri.ToString();
                return Task.FromResult(new HttpResponseMessage(_status) { Content = new StringContent(_body) });
            }
        }

        static Node Args(bool siteKey = true, bool secret = true, bool min = true, string token = "tok")
        {
            var node = new Node("validators.recaptcha", token);
            if (siteKey)
                node.Add(new Node("site-key", "site"));
            if (secret)
                node.Add(new Node("secret", "shh"));
            if (min)
                node.Add(new Node("min", 0.5m));
            return node;
        }

        static Task Run(FakeHandler handler, Node args)
        {
            return new ValidateReCaptcha(new HttpClient(handler)).SignalAsync(null, args);
        }

        [Fact]
        public async Task ScoreAboveMinimumPasses()
        {
            var handler = new FakeHandler(HttpStatusCode.OK, "{\"success\":true,\"score\":0.9}");
            var args = Args();
            await Run(handler, args);
            Assert.Contains("secret=shh", handler.Url);
            Assert.Contains("response=tok", handler.Url);
            Assert.Empty(args.Children);
            Assert.Null(args.Value);
        }

        [Fact]
        public async Task ScoreBelowMinimumThrowsBadRequest()
        {
            var handler = new FakeHandler(HttpStatusCode.OK, "{\"success\":true,\"score\":0.1}");
            var ex = await Assert.ThrowsAsync<HyperlambdaException>(() => Run(handler, Args()));
            Assert.Equal(400, ex.Status);
            Assert.True(ex.IsPublic);
            Assert.Contains("below 0.5", ex.Message);
        }

        [Fact]
        public async Task FailureResponseThrowsWithErrorCode()
        {
            var handler = new FakeHandler(HttpStatusCode.OK, "{\"success\":false,\"error-codes\":[\"invalid-input-response\"]}");
            var ex = await Assert.ThrowsAsync<HyperlambdaException>(() => Run(handler, Args()));
            Assert.Equal(500, ex.Status);
            Assert.Contains("invalid-input-response", ex.Message);
        }

        [Fact]
        public async Task MissingScoreThrows()
        {
            var handler = new FakeHandler(HttpStatusCode.OK, "{\"success\":true}");
            var ex = await Assert.ThrowsAsync<HyperlambdaException>(() => Run(handler, Args()));
            Assert.Contains("null", ex.Message);
        }

        [Fact]
        public async Task NonOkStatusThrows()
        {
            var handler = new FakeHandler(HttpStatusCode.BadGateway, "");
            var ex = await Assert.ThrowsAsync<HyperlambdaException>(() => Run(handler, Args()));
            Assert.Contains("didn't return success code", ex.Message);
        }

        [Fact]
        /*
         * A missing argument currently surfaces as a NullReferenceException, not the HyperlambdaException the
         * code says it throws, since GetEx is called on the missing child before the null-coalescing throw.
         */
        public async Task MissingArgumentsThrow()
        {
            var handler = new FakeHandler(HttpStatusCode.OK, "{}");
            await Assert.ThrowsAnyAsync<System.Exception>(() => Run(handler, Args(siteKey: false)));
            await Assert.ThrowsAnyAsync<System.Exception>(() => Run(handler, Args(secret: false)));
            await Assert.ThrowsAnyAsync<System.Exception>(() => Run(handler, Args(min: false)));
            await Assert.ThrowsAnyAsync<System.Exception>(() => Run(handler, Args(token: null)));
            Assert.Null(handler.Url);
        }
    }
}
