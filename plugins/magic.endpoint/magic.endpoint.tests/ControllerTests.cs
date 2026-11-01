/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Primitives;
using Moq;
using Xunit;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.endpoint.contracts;
using magic.endpoint.contracts.poco;
using magic.endpoint.controller;

namespace magic.endpoint.tests
{
    public class ControllerTests
    {
        static readonly byte[] Bytes = [1, 2, 3];

        MagicRequest _captured;
        MagicResponse _response = new MagicResponse { Content = "ok" };
        readonly DefaultHttpContext _context = new DefaultHttpContext();

        EndpointController Controller()
        {
            var executor = new Mock<IHttpExecutorAsync>();
            executor
                .Setup(x => x.ExecuteAsync(It.IsAny<MagicRequest>()))
                .Callback((MagicRequest r) => _captured = r)
                .ReturnsAsync(() => _response);
            _context.Response.Body = new MemoryStream();
            return new EndpointController(executor.Object, Common.Initialize().GetService<ISignaler>())
            {
                ControllerContext = new ControllerContext { HttpContext = _context },
            };
        }

        static void Body(HttpRequest request, string content, string contentType, bool withLength = true)
        {
            var bytes = Encoding.UTF8.GetBytes(content);
            request.Body = new MemoryStream(bytes);
            request.ContentType = contentType;
            if (withLength)
                request.ContentLength = bytes.Length;
        }

        async Task<IActionResult> Run(string method, string url = "foo/bar")
        {
            _context.Request.Method = method;
            return await Controller().Execute(url);
        }

        [Fact]
        public async Task GetMapsTheRequest()
        {
            _context.Request.QueryString = new QueryString("?a=1&b=two");
            _context.Request.Headers["X-Test"] = "header-value";
            _context.Request.Headers.Cookie = "c1=v1";
            _context.Request.Host = new HostString("example.com");
            _context.Request.Scheme = "https";
            _context.Connection.RemoteIpAddress = IPAddress.Parse("10.1.2.3");

            var result = await Run("GET", "foo%20bar/baz");

            Assert.Equal("foo bar/baz", _captured.URL);
            Assert.Equal("get", _captured.Verb);
            Assert.Equal("1", _captured.Query["a"]);
            Assert.Equal("two", _captured.Query["b"]);
            Assert.Equal("header-value", _captured.Headers["x-test"]);
            Assert.Equal("v1", _captured.Cookies["c1"]);
            Assert.Equal("example.com", _captured.Host);
            Assert.Equal("https", _captured.Scheme);
            Assert.Equal(IPAddress.Parse("10.1.2.3"), _captured.Ip);
            var content = Assert.IsType<ContentResult>(result);
            Assert.Equal("ok", content.Content);
            Assert.Equal(200, content.StatusCode);
        }

        [Fact]
        public async Task NullUrlBecomesEmpty()
        {
            await Run("DELETE", null);
            Assert.Equal("", _captured.URL);
            Assert.Equal("delete", _captured.Verb);
        }

        [Fact]
        public async Task UnsupportedVerbThrows()
        {
            var ex = await Assert.ThrowsAsync<HyperlambdaException>(() => Run("OPTIONS"));
            Assert.Contains("options", ex.Message);
        }

        [Fact]
        public async Task PostParsesJsonPayload()
        {
            Body(_context.Request, "{\"foo\":\"bar\",\"n\":42}", "application/json");
            await Run("POST");
            Assert.Equal("bar", _captured.Payload.Children.First(x => x.Name == "foo").Value);
            Assert.Equal(42L, _captured.Payload.Children.First(x => x.Name == "n").Value);
        }

        [Fact]
        public async Task PostWithoutContentTypeDefaultsToJson()
        {
            Body(_context.Request, "{\"foo\":\"bar\"}", null);
            await Run("PUT");
            Assert.Equal("bar", _captured.Payload.Children.First().Value);
        }

        [Fact]
        public async Task JsonWithoutContentLengthIsBuffered()
        {
            Body(_context.Request, "{\"foo\":\"chunked\"}", "application/json", withLength: false);
            await Run("PATCH");
            Assert.Equal("chunked", _captured.Payload.Children.First().Value);
        }

        [Fact]
        public async Task JsonWithAnotherCharsetIsTranscoded()
        {
            var bytes = Encoding.Latin1.GetBytes("{\"foo\":\"café\"}");
            _context.Request.Body = new MemoryStream(bytes);
            _context.Request.ContentType = "application/json; charset=\"iso-8859-1\"";
            _context.Request.ContentLength = bytes.Length;
            await Run("POST");
            Assert.Equal("café", _captured.Payload.Children.First().Value);
        }

        [Fact]
        public async Task PostParsesUrlEncodedForm()
        {
            Body(_context.Request, "a=1&b=two", "application/x-www-form-urlencoded");
            await Run("POST");
            Assert.Equal("1", _captured.Payload.Children.First(x => x.Name == "a").Value);
            Assert.Equal("two", _captured.Payload.Children.First(x => x.Name == "b").Value);
        }

        [Fact]
        public async Task PostParsesMultipartForm()
        {
            var file = new FormFile(new MemoryStream(Encoding.UTF8.GetBytes("file content")), 0, 12, "upload", "doc.txt");
            var form = new FormCollection(
                new System.Collections.Generic.Dictionary<string, StringValues> { ["field"] = "value" },
                new FormFileCollection { file });
            _context.Features.Set<IFormFeature>(new FormFeature(form));
            _context.Request.ContentType = "multipart/form-data; boundary=x";
            await Run("POST");
            Assert.Equal("value", _captured.Payload.Children.First(x => x.Name == "field").Value);
            var fileNode = _captured.Payload.Children.First(x => x.Name == "file");
            Assert.Equal("doc.txt", fileNode.Children.First(x => x.Name == "name").Value);
            Assert.IsAssignableFrom<Stream>(fileNode.Children.First(x => x.Name == "stream").Value);
        }

        [Fact]
        public async Task UnknownContentTypeGetsRawBodyStream()
        {
            Body(_context.Request, "raw", "application/x-unknown-thing");
            await Run("POST");
            Assert.IsAssignableFrom<Stream>(_captured.Payload.Children.First(x => x.Name == "body").Value);
        }

        [Fact]
        public async Task RegisteredPayloadHandlerIsUsed()
        {
            EndpointController.RegisterContentType(
                "application/x-test-payload",
                (_, _) => Task.FromResult(new Node("", null, [new Node("custom", "yes")])));
            Body(_context.Request, "whatever", "application/x-test-payload");
            await Run("POST");
            Assert.Equal("yes", _captured.Payload.Children.First(x => x.Name == "custom").Value);
        }

        [Fact]
        public async Task NullContentBecomesStatusCode()
        {
            _response = new MagicResponse { Result = 204, Content = null };
            var result = await Run("GET");
            Assert.Equal(204, Assert.IsType<StatusCodeResult>(result).StatusCode);
        }

        [Fact]
        public async Task JsonContentIsWrittenAsBytes()
        {
            _response = new MagicResponse { Result = 201, Content = new JsonContent(Encoding.UTF8.GetBytes("{\"x\":1}")) };
            var result = await Run("GET");
            var actionContext = new ActionContext(_context, new Microsoft.AspNetCore.Routing.RouteData(), new Microsoft.AspNetCore.Mvc.Abstractions.ActionDescriptor());
            await result.ExecuteResultAsync(actionContext);
            Assert.Equal(201, _context.Response.StatusCode);
            _context.Response.Body.Position = 0;
            Assert.Equal("{\"x\":1}", new StreamReader(_context.Response.Body).ReadToEnd());
        }

        [Fact]
        public async Task JsonHandlerReturnsNullForOtherContent()
        {
            _response = new MagicResponse { Content = 42 };
            var result = Assert.IsType<ContentResult>(await Run("GET"));
            Assert.Equal("null", result.Content);
        }

        [Fact]
        public async Task NonJsonStringBecomesContentResult()
        {
            _response = new MagicResponse { Result = 202, Content = "plain", Headers = { ["Content-Type"] = "text/plain; charset=utf-8" } };
            var result = Assert.IsType<ContentResult>(await Run("GET"));
            Assert.Equal("plain", result.Content);
            Assert.Equal(202, result.StatusCode);
        }

        [Fact]
        public async Task BytesBecomeFileContent()
        {
            _response = new MagicResponse { Content = Bytes, Headers = { ["Content-Type"] = "application/octet-stream" } };
            var result = Assert.IsType<FileContentResult>(await Run("GET"));
            Assert.Equal(Bytes, result.FileContents);
        }

        [Fact]
        public async Task StreamBecomesFileStream()
        {
            _response = new MagicResponse { Content = new MemoryStream(Bytes), Headers = { ["Content-Type"] = "image/png" } };
            var result = Assert.IsType<FileStreamResult>(await Run("GET"));
            Assert.Equal("image/png", result.ContentType);
        }

        [Fact]
        public async Task UnsupportedContentTypeOfObjectThrows()
        {
            _response = new MagicResponse { Content = new object(), Headers = { ["Content-Type"] = "text/plain" } };
            var ex = await Assert.ThrowsAsync<HyperlambdaException>(() => Run("GET"));
            Assert.Contains("System.Object", ex.Message);
        }

        [Fact]
        public async Task RegisteredResponseHandlerIsUsed()
        {
            EndpointController.RegisterContentType(
                "application/x-test-response",
                (Func<MagicResponse, IActionResult>)(r => new OkObjectResult("handled")));
            _response = new MagicResponse { Content = "x", Headers = { ["Content-Type"] = "application/x-test-response" } };
            var result = Assert.IsType<OkObjectResult>(await Run("GET"));
            Assert.Equal("handled", result.Value);
        }

        [Fact]
        public async Task HeadersAndCookiesAreApplied()
        {
            _response = new MagicResponse
            {
                Content = "ok",
                Headers = { ["X-Custom"] = "yes" },
                Cookies =
                {
                    new MagicCookie { Name = "lax", Value = "1", Path = "/" },
                    new MagicCookie { Name = "strict", Value = "2", Path = "/", SameSite = "Strict", HttpOnly = true, Secure = true, Expires = DateTime.UtcNow.AddDays(1) },
                },
            };
            await Run("GET");
            Assert.Equal("yes", _context.Response.Headers["X-Custom"]);
            var cookies = _context.Response.Headers.SetCookie.ToString();
            Assert.Contains("lax=1", cookies);
            Assert.Contains("samesite=lax", cookies, StringComparison.OrdinalIgnoreCase);
            Assert.Contains("strict=2", cookies);
            Assert.Contains("samesite=strict", cookies, StringComparison.OrdinalIgnoreCase);
            Assert.Contains("httponly", cookies, StringComparison.OrdinalIgnoreCase);
        }
    }
}
