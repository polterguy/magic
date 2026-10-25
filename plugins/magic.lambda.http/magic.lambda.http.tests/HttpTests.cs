// #define DEEP_TESTING
/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Text;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using Xunit;
using Newtonsoft.Json.Linq;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.http.tests
{
    public class HttpTests
    {
        [Fact]
        public void GetJson()
        {
            var lambda = Common.Evaluate(@"
http.get:""https://jsonplaceholder.typicode.com/users/1""
");
            Assert.Equal(200, lambda.Children.First().Value);
            Assert.Equal(2, lambda.Children.First().Children.Count());
            Assert.Equal("headers", lambda.Children.First().Children.First().Name);
            Assert.True(lambda.Children.First().Children.First().Children.Count() > 5);
            Assert.Equal("content", lambda.Children.First().Children.Skip(1).First().Name);
            var json = JObject.Parse(lambda.Children.First().Children.Skip(1).First().Get<string>());
            Assert.NotNull(json);
        }

        [Fact]
        public void PostSignatureDocumentsPayloadAndFilenameAsAlternatives()
        {
            var lambda = Common.Evaluate("slot.signature:http.post");
            var signature = lambda.Children.First();
            var constraint = signature.Children
                .First(x => x.Name == "constraints")
                .Children
                .First(x => x.Name == SlotConstraintKind.ExactlyOneOf.ToString());
            var values = constraint.Children.First(x => x.Name == "values").Children.Select(x => x.GetEx<string>()).ToList();

            Assert.Contains("payload", values);
            Assert.Contains("filename", values);
        }

        [Fact]
        public void Throws_01()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
http.get:""https://jsonplaceholder.typicode.com/users/1""
   token:foo
   foo:throws
"));
        }

        [Fact]
        public void Throws_02()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
http.post:""https://jsonplaceholder.typicode.com/users/1""
   token:foo
   paylod:howdy
   foo:throws
"));
        }

        [Fact]
        public void Throws_03()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
http.post:""https://jsonplaceholder.typicode.com/users/1""
   token:foo
   foo:throws
"));
        }

        [Fact]
        public void Throws_04()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
http.get:""https://jsonplaceholder.typicode.com/users/1""
   foo:throws
"));
        }

        [Fact]
        public void GetJsonPayload_Throws()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
http.get:""https://jsonplaceholder.typicode.com/users/1""
   payload:foo
"));
        }

        [Fact]
        public async Task GetJsonAsync()
        {
            var lambda = await Common.EvaluateAsync(@"
http.get:""https://jsonplaceholder.typicode.com/users/1""
");
            Assert.Equal(200, lambda.Children.First().Value);
        }

        [Fact]
        public void GetWithHeaders()
        {
            var lambda = Common.Evaluate(@"
http.get:""https://jsonplaceholder.typicode.com/users/1""
   headers
      Foo:Bar");
            Assert.Equal(200, lambda.Children.First().Value);
            Assert.Equal(2, lambda.Children.First().Children.Count());
            Assert.Equal("headers", lambda.Children.First().Children.First().Name);
            Assert.True(lambda.Children.First().Children.First().Children.Count() > 5);
            Assert.Equal("content", lambda.Children.First().Children.Skip(1).First().Name);
            var json = JObject.Parse(lambda.Children.First().Children.Skip(1).First().Get<string>());
            Assert.NotNull(json);
        }

        [Fact]
        public void GetWithToken()
        {
            var lambda = Common.Evaluate(@"
http.get:""https://jsonplaceholder.typicode.com/users/1""
   token:foo-bar");
            Assert.Equal(200, lambda.Children.First().Value);
            Assert.Equal(2, lambda.Children.First().Children.Count());
            Assert.Equal("headers", lambda.Children.First().Children.First().Name);
            Assert.True(lambda.Children.First().Children.First().Children.Count() > 5);
            Assert.Equal("content", lambda.Children.First().Children.Skip(1).First().Name);
            var json = JObject.Parse(lambda.Children.First().Children.Skip(1).First().Get<string>());
            Assert.NotNull(json);
        }

        [Fact]
        public void PostJson()
        {
            var lambda = Common.Evaluate(@"
http.post:""https://jsonplaceholder.typicode.com/postsXX""
   payload:@""{""""userId"""":1, """"id"""":1}""
");
            Assert.Equal(404, lambda.Children.First().Value);
        }

        [Fact]
        public async Task PostJsonAsync()
        {
            var lambda = await Common.EvaluateAsync(@"
http.post:""https://jsonplaceholder.typicode.com/posts""
   payload:@""{""""userId"""":1, """"id"""":1}""
");
            Assert.Equal(201, lambda.Children.First().Value);
        }

        [Fact]
        public async Task PostFileAsync()
        {
            var lambda = await Common.EvaluateAsync(@"
http.post:""https://jsonplaceholder.typicode.com/posts""
   filename:/test.json
");
            Assert.Equal(201, lambda.Children.First().Value);
        }

        [Fact]
        public async Task PostLambdaAsync()
        {
            var lambda = await Common.EvaluateAsync(@"
http.post:""https://jsonplaceholder.typicode.com/posts""
   payload
      userId:int:1
      id:int:1");
            Assert.Equal(201, lambda.Children.First().Value);
        }

        [Fact]
        public async Task PostLambdaAsyncAutoConvert()
        {
            var lambda = await Common.EvaluateAsync(@"
http.post:""https://jsonplaceholder.typicode.com/posts""
   convert:true
   payload
      userId:int:1
      id:int:1");
            Assert.Equal(201, lambda.Children.First().Value);
            Assert.Equal(2, lambda.Children.First().Children.FirstOrDefault(x => x.Name == "content").Children.Count());
        }

        [Fact]
        public async Task PostJsonErrorObjectAsyncAutoConvert()
        {
            var lambda = await Common.EvaluateAsync(@"
http.post:""https://example.com/endpoint""
   convert:true
   payload
      userId:int:1
", (_, _) => Task.FromResult(new HttpResponseMessage(HttpStatusCode.BadRequest)
            {
                Content = new StringContent(
                    @"{""error"":{""message"":""bad request""}}",
                    Encoding.UTF8,
                    "application/json"),
            }));

            Assert.Equal(400, lambda.Children.First().Value);
            Assert.Equal(
                "bad request",
                lambda
                    .Children
                    .First()
                    .Children
                    .First(x => x.Name == "content")
                    .Children
                    .First(x => x.Name == "error")
                    .Children
                    .First(x => x.Name == "message")
                    .GetEx<string>());
        }

        [Fact]
        public async Task PostJsonErrorStringAsyncAutoConvert()
        {
            var lambda = await Common.EvaluateAsync(@"
http.post:""https://example.com/endpoint""
   convert:true
   payload
      userId:int:1
", (_, _) => Task.FromResult(new HttpResponseMessage(HttpStatusCode.BadRequest)
            {
                Content = new StringContent(
                    @"""bad request""",
                    Encoding.UTF8,
                    "application/json"),
            }));

            Assert.Equal(400, lambda.Children.First().Value);
            Assert.Equal(
                "bad request",
                lambda.Children.First().Children.First(x => x.Name == "content").GetEx<string>());
        }

        [Fact]
        public void PutJson()
        {
            var lambda = Common.Evaluate(@"
http.put:""https://jsonplaceholder.typicode.com/posts/1""
   payload:@""{""""userId"""":1, """"id"""":1}""
");
            Assert.Equal(200, lambda.Children.First().Value);
        }

        [Fact]
        public void PutLambda()
        {
            var lambda = Common.Evaluate(@"
http.put:""https://jsonplaceholder.typicode.com/posts/1""
   payload
      userId:int:1
      id:int:1
");
            Assert.Equal(200, lambda.Children.First().Value);
        }

        [Fact]
        public void PutLambdaExpression()
        {
            var lambda = Common.Evaluate(@"
.userId:int:1
http.put:""https://jsonplaceholder.typicode.com/posts/1""
   payload
      userId:x:@.userId
      id:int:1
");
            Assert.Equal(200, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public async Task PutJsonAsync()
        {
            var lambda = await Common.EvaluateAsync(@"
http.put:""https://jsonplaceholder.typicode.com/posts/1""
   payload:@""{""""userId"""":1, """"id"""":1}""
");
            Assert.Equal(200, lambda.Children.First().Value);
        }

        [Fact]
        public void DeleteJson()
        {
            var lambda = Common.Evaluate(@"
http.delete:""https://jsonplaceholder.typicode.com/posts/1""
");
            Assert.Equal(200, lambda.Children.First().Value);
        }

        [Fact]
        public void DeleteJsonPayload_Throws()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
http.delete:""https://jsonplaceholder.typicode.com/posts/1""
   payload:foo
"));
        }

        [Fact]
        public async Task DeleteJsonAsync()
        {
            var lambda = await Common.EvaluateAsync(@"
http.delete:""https://jsonplaceholder.typicode.com/posts/1""
");
            Assert.Equal(200, lambda.Children.First().Value);
        }

        [Fact]
        public async Task HttpGet_WhitelistPin_AllowsPinnedUrl()
        {
            var invoked = false;
            await Common.EvaluateAsync(@"
whitelist
   vocabulary
      http.get:""https://foo.com/*""
   .lambda
      http.get:""https://foo.com/bar/baz""
", async (request, _) =>
            {
                invoked = true;
                Assert.Equal("https://foo.com/bar/baz", request.RequestUri.ToString());
                return new HttpResponseMessage(HttpStatusCode.OK);
            });
            Assert.True(invoked);
        }

        [Fact]
        public async Task HttpGet_WhitelistPin_HostSuffix_Throws()
        {
            await Assert.ThrowsAsync<HyperlambdaException>(async () => await Common.EvaluateAsync(@"
whitelist
   vocabulary
      http.get:""https://foo.com/*""
   .lambda
      http.get:""https://foo.com.evil.com/x""
", (_, _) => Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK))));
        }

        [Fact]
        public async Task HttpGet_WhitelistPin_UserInfo_Throws()
        {
            await Assert.ThrowsAsync<HyperlambdaException>(async () => await Common.EvaluateAsync(@"
whitelist
   vocabulary
      http.get:""https://foo.com/*""
   .lambda
      http.get:""https://foo.com@evil.com/x""
", (_, _) => Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK))));
        }

        [Fact]
        public async Task HttpGet_WhitelistPin_SchemeSwitch_Throws()
        {
            await Assert.ThrowsAsync<HyperlambdaException>(async () => await Common.EvaluateAsync(@"
whitelist
   vocabulary
      http.get:""https://foo.com/*""
   .lambda
      http.get:""http://foo.com/x""
", (_, _) => Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK))));
        }

        [Fact]
        public async Task HttpGet_WhitelistPin_ExactPath_Succeeds()
        {
            var invoked = false;
            await Common.EvaluateAsync(@"
whitelist
   vocabulary
      http.get:""https://foo.com/api""
   .lambda
      http.get:""https://foo.com/api""
", async (request, _) =>
            {
                invoked = true;
                return new HttpResponseMessage(HttpStatusCode.OK);
            });
            Assert.True(invoked);
        }

        [Fact]
        public async Task HttpGet_WhitelistPin_ExtraSegment_Throws()
        {
            await Assert.ThrowsAsync<HyperlambdaException>(async () => await Common.EvaluateAsync(@"
whitelist
   vocabulary
      http.get:""https://foo.com/api""
   .lambda
      http.get:""https://foo.com/api/users""
", (_, _) => Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK))));
        }

        [Fact]
        public async Task HttpGet_BarePin_AllowsAnyUrl()
        {
            var invoked = false;
            await Common.EvaluateAsync(@"
whitelist
   vocabulary
      http.get
   .lambda
      http.get:""https://anything.example.org/whatever""
", async (request, _) =>
            {
                invoked = true;
                return new HttpResponseMessage(HttpStatusCode.OK);
            });
            Assert.True(invoked);
        }

        [Fact]
        public async Task HttpGet_WhitelistPin_UrlParams_Succeeds()
        {
            await Common.EvaluateAsync(@"
whitelist
   vocabulary
      http.get:""https://foo.com/users/{id}""
   .lambda
      http.get:""https://foo.com/users/{id}""
         url-params
            id:123
", async (request, _) =>
            {
                Assert.Equal("https://foo.com/users/123", request.RequestUri.ToString());
                return new HttpResponseMessage(HttpStatusCode.OK);
            });
        }

        [Fact]
        public async Task HttpGet_WhitelistPin_UrlParamsPathEscape_Throws()
        {
            // The pin matches the raw template, but the substituted value escapes the pinned path.
            await Assert.ThrowsAsync<HyperlambdaException>(async () => await Common.EvaluateAsync(@"
whitelist
   vocabulary
      http.get:""https://foo.com/api/{id}""
   .lambda
      http.get:""https://foo.com/api/{id}""
         url-params
            id:""../admin""
", (_, _) => Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK))));
        }

        [Fact]
        public async Task HttpGet_Redirect_ToPinnedHost_Succeeds()
        {
            var second = false;
            await Common.EvaluateAsync(@"
whitelist
   vocabulary
      http.get:""https://foo.com/*""
      http.get:""https://bar.com/*""
   .lambda
      http.get:""https://foo.com/start""
", async (request, _) =>
            {
                if (request.RequestUri.Host == "foo.com")
                {
                    var response = new HttpResponseMessage(HttpStatusCode.Redirect);
                    response.Headers.Location = new Uri("https://bar.com/final");
                    return response;
                }
                second = true;
                Assert.Equal("https://bar.com/final", request.RequestUri.ToString());
                return new HttpResponseMessage(HttpStatusCode.OK);
            });
            Assert.True(second);
        }

        [Fact]
        public async Task HttpGet_Redirect_ToUnpinnedHost_Throws()
        {
            var hops = 0;
            await Assert.ThrowsAsync<HyperlambdaException>(async () => await Common.EvaluateAsync(@"
whitelist
   vocabulary
      http.get:""https://foo.com/*""
   .lambda
      http.get:""https://foo.com/start""
", async (request, _) =>
            {
                hops++;
                if (hops == 1)
                {
                    var response = new HttpResponseMessage(HttpStatusCode.Redirect);
                    response.Headers.Location = new Uri("https://evil.com/");
                    return response;
                }
                return new HttpResponseMessage(HttpStatusCode.OK);
            }));
        }

        [Fact]
        public async Task HttpGet_Redirect_RelativeLocation_Succeeds()
        {
            var second = false;
            await Common.EvaluateAsync(@"
whitelist
   vocabulary
      http.get:""https://foo.com/*""
   .lambda
      http.get:""https://foo.com/start""
", async (request, _) =>
            {
                if (request.RequestUri.AbsolutePath == "/start")
                {
                    var response = new HttpResponseMessage(HttpStatusCode.MovedPermanently);
                    response.Headers.TryAddWithoutValidation("Location", "/final");
                    return response;
                }
                second = true;
                Assert.Equal("/final", request.RequestUri.AbsolutePath);
                return new HttpResponseMessage(HttpStatusCode.OK);
            });
            Assert.True(second);
        }

        [Fact]
        public async Task HttpDelete_Redirect_SeeOther_SwitchesToGet()
        {
            // A 303 (See Other) instructs the client to retrieve, not to repeat the side
            // effect, so even a DELETE must switch to a plain GET on the next hop.
            var hops = 0;
            await Common.EvaluateAsync(@"
whitelist
   vocabulary
      http.delete:""https://foo.com/*""
   .lambda
      http.delete:""https://foo.com/start""
", async (request, _) =>
            {
                hops++;
                if (hops == 1)
                {
                    var response = new HttpResponseMessage(HttpStatusCode.SeeOther);
                    response.Headers.Location = new Uri("https://foo.com/final");
                    return response;
                }
                Assert.Equal(HttpMethod.Get, request.Method);
                return new HttpResponseMessage(HttpStatusCode.OK);
            });
            Assert.Equal(2, hops);
        }
    }
}
