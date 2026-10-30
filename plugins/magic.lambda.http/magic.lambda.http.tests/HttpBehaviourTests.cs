/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Xunit;
using magic.node;
using magic.node.extensions;
using magic.lambda.http.services;

namespace magic.lambda.http.tests
{
    /*
     * Timeouts, streamed responses, redirects that carry a body or a token, and the extension points for
     * Content-Types, using a fake server.
     */
    /// <summary>
    /// Records what the lambda of a streamed response saw, which is how the test gets to know that it ran.
    /// </summary>
    [magic.signals.contracts.Slot(Name = "test.sse.mark")]
    public class TestSseMark : magic.signals.contracts.ISlot
    {
        public static readonly System.Collections.Concurrent.ConcurrentQueue<(string Marker, string Message)> Messages = new();

        public void Signal(magic.signals.contracts.ISignaler signaler, Node input)
        {
            Messages.Enqueue((input.GetEx<string>(), input.Children.First(x => x.Name == "message").GetEx<string>()));
        }
    }

    public class HttpBehaviourTests
    {
        static readonly string[] SseExpected = { "one", "two", "three" };

        static HttpResponseMessage Ok(string body = "") => new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent(body) };

        #region [ -- Timeout -- ]

        [Theory]
        [InlineData(0)]
        [InlineData(-1)]
        [InlineData(601)]
        public async Task TimeoutMustBeBetweenOneAndSixHundredSeconds(int seconds)
        {
            var ex = await Assert.ThrowsAsync<HyperlambdaException>(() => Common.EvaluateAsync(
                "http.get:\"https://example.com/x\"\n   timeout:int:" + seconds, (_, _) => Task.FromResult(Ok())));
            Assert.Contains("between 1 and 600", ex.Message);
        }

        [Fact]
        public async Task TimeoutThatIsNotReachedChangesNothing()
        {
            var lambda = await Common.EvaluateAsync(
                "http.get:\"https://example.com/x\"\n   timeout:int:30", (_, _) => Task.FromResult(Ok("fine")));
            Assert.Equal(200, lambda.Children.First().Value);
        }

        [Fact]
        public async Task TimeoutCancelsASlowRequest()
        {
            var watch = System.Diagnostics.Stopwatch.StartNew();
            await Assert.ThrowsAnyAsync<OperationCanceledException>(() => Common.EvaluateAsync(
                "http.get:\"https://example.com/x\"\n   timeout:int:1",
                async (_, token) =>
                {
                    await Task.Delay(TimeSpan.FromSeconds(20), token);
                    return Ok();
                }));
            Assert.True(watch.Elapsed < TimeSpan.FromSeconds(10), "The timeout should have ended the request after about a second");
        }

        #endregion

        #region [ -- Server sent events -- ]

        [Fact]
        public async Task EveryLineOfAStreamedResponseRunsTheLambda()
        {
            var marker = Guid.NewGuid().ToString("N");
            var lambda = await Common.EvaluateAsync(
                "http.get:\"https://example.com/stream\"\n   .sse\n      test.sse.mark:" + marker + "\n         message:x:@.arguments/*/message",
                (_, _) => Task.FromResult(Ok("one\ntwo\nthree\n")));
            Assert.Equal(200, lambda.Children.First().Value);
            Assert.Equal(
                SseExpected,
                TestSseMark.Messages.Where(x => x.Marker == marker).Select(x => x.Message).ToArray());
        }

        #endregion

        #region [ -- Redirects -- ]

        static async Task<List<(HttpMethod Method, string Url, string Body, string Authorization, string ContentType)>> FollowAsync(
            HttpStatusCode redirect,
            string verb,
            string target)
        {
            var seen = new List<(HttpMethod, string, string, string, string)>();
            await Common.EvaluateAsync(
                "http." + verb + ":\"https://example.com/start\"\n   token:secret\n   payload\n      a:int:1",
                async (request, ct) =>
                {
                    seen.Add((
                        request.Method,
                        request.RequestUri.ToString(),
                        request.Content == null ? null : await request.Content.ReadAsStringAsync(ct),
                        request.Headers.Authorization?.ToString(),
                        request.Content?.Headers.ContentType?.MediaType));
                    if (seen.Count == 1)
                    {
                        var response = new HttpResponseMessage(redirect);
                        response.Headers.Location = new Uri(target, UriKind.RelativeOrAbsolute);
                        return response;
                    }
                    return Ok();
                });
            return seen;
        }

        [Theory]
        [InlineData(HttpStatusCode.TemporaryRedirect)]
        [InlineData(HttpStatusCode.PermanentRedirect)]
        public async Task TemporaryAndPermanentRedirectsKeepTheMethodAndTheBody(HttpStatusCode status)
        {
            var seen = await FollowAsync(status, "post", "https://example.com/next");
            Assert.Equal(2, seen.Count);
            Assert.Equal(HttpMethod.Post, seen[1].Method);
            Assert.Equal("{\"a\":1}", seen[1].Body);
            Assert.Equal("application/json", seen[1].ContentType);
        }

        [Theory]
        [InlineData(HttpStatusCode.MovedPermanently)]
        [InlineData(HttpStatusCode.Redirect)]
        [InlineData(HttpStatusCode.SeeOther)]
        public async Task OtherRedirectsTurnAPostIntoAGetWithoutABody(HttpStatusCode status)
        {
            var seen = await FollowAsync(status, "post", "https://example.com/next");
            Assert.Equal(HttpMethod.Get, seen[1].Method);
            Assert.Null(seen[1].Body);
            Assert.Null(seen[1].ContentType);
        }

        [Fact]
        public async Task TheTokenIsNotCarriedToAnotherHost()
        {
            var sameHost = await FollowAsync(HttpStatusCode.TemporaryRedirect, "post", "https://example.com/next");
            Assert.Equal("Bearer secret", sameHost[1].Authorization);

            var otherHost = await FollowAsync(HttpStatusCode.TemporaryRedirect, "post", "https://other.example.org/next");
            Assert.Equal("Bearer secret", otherHost[0].Authorization);
            Assert.Null(otherHost[1].Authorization);
        }

        [Fact]
        public async Task RelativeLocationIsResolvedAgainstThePreviousUrl()
        {
            var seen = await FollowAsync(HttpStatusCode.Found, "post", "/elsewhere");
            Assert.Equal("https://example.com/elsewhere", seen[1].Url);
        }

        [Fact]
        public async Task RedirectWithoutALocationIsAnOrdinaryResponse()
        {
            var lambda = await Common.EvaluateAsync(
                "http.get:\"https://example.com/x\"",
                (_, _) => Task.FromResult(new HttpResponseMessage(HttpStatusCode.Found) { Content = new StringContent("") }));
            Assert.Equal(302, lambda.Children.First().Value);
        }

        [Fact]
        public async Task TooManyRedirectsThrows()
        {
            var ex = await Assert.ThrowsAsync<HyperlambdaException>(() => Common.EvaluateAsync(
                "http.get:\"https://example.com/loop\"",
                (_, _) =>
                {
                    var response = new HttpResponseMessage(HttpStatusCode.Found);
                    response.Headers.Location = new Uri("https://example.com/loop");
                    return Task.FromResult(response);
                }));
            Assert.Contains("redirects", ex.Message);
        }

        #endregion

        #region [ -- Extension points -- ]

        [Fact]
        public async Task CustomRequestHandler()
        {
            MagicHttp.AddRequestHandler("application/x-custom-request", (signaler, headers, payload, slot) =>
                "custom:" + string.Join(",", payload.Children.Select(x => x.Name + "=" + x.Value)));
            string body = null;
            await Common.EvaluateAsync(
                "http.post:\"https://example.com/x\"\n   headers\n      Content-Type:application/x-custom-request\n   payload\n      a:1\n      b:2",
                async (request, ct) =>
                {
                    body = await request.Content.ReadAsStringAsync(ct);
                    return Ok();
                });
            Assert.Equal("custom:a=1,b=2", body);
        }

        [Fact]
        public async Task CustomResponseHandler()
        {
            MagicHttp.AddResponseHandler("application/x-custom-response", async (signaler, content) =>
                new Node("content", "custom:" + await content.ReadAsStringAsync()));
            var lambda = await Common.EvaluateAsync(
                "http.get:\"https://example.com/x\"\n   convert:true",
                (_, _) =>
                {
                    var content = new StringContent("hello", Encoding.UTF8);
                    content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/x-custom-response");
                    return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK) { Content = content });
                });
            Assert.Equal("custom:hello", lambda.Children.First().Children.First(x => x.Name == "content").Value);
        }

        #endregion
    }
}
