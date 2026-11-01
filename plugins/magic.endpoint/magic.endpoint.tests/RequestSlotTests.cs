/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Net;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.endpoint.contracts.poco;

namespace magic.endpoint.tests
{
    public class RequestSlotTests
    {
        static readonly string[] FooAndX = ["foo", "x"];

        static Node Signal(string slot, MagicRequest request, Action<Node> args = null)
        {
            var signaler = Common.Initialize().GetService<ISignaler>();
            var node = new Node(slot);
            args?.Invoke(node);
            signaler.Scope("http.request", request, () => signaler.Signal(slot, node));
            return node;
        }

        static MagicRequest Request(string ip = "192.168.1.7") => new MagicRequest
        {
            URL = "/magic/modules/foo/bar",
            Ip = IPAddress.Parse(ip),
        };

        [Fact]
        public void IpDefaultsToIpv4()
        {
            Assert.Equal("192.168.1.7", Signal("request.ip", Request()).Value);
        }

        [Fact]
        public void Ipv4MapsAnIpv6MappedAddress()
        {
            Assert.Equal("10.0.0.1", Signal("request.ip", Request("::ffff:10.0.0.1")).Value);
        }

        [Fact]
        public void IpCanBeReturnedAsIpv6()
        {
            var node = Signal("request.ip", Request(), x => x.Add(new Node("version", "ipv6")));
            Assert.Equal("::ffff:192.168.1.7", node.Value);
        }

        [Fact]
        public void IpWithUnknownVersionThrows()
        {
            var ex = Assert.Throws<HyperlambdaException>(() => Signal("request.ip", Request(), x => x.Add(new Node("version", "ipv9"))));
            Assert.Contains("ipv9", ex.Message);
        }

        [Fact]
        public void UrlReturnsUrlAndQueryParameters()
        {
            var request = Request();
            request.Query["foo"] = "bar";
            request.Query["x"] = "1";
            var node = Signal("request.url", request);
            Assert.Equal("/magic/modules/foo/bar", node.Value);
            Assert.Equal(FooAndX, node.Children.Select(x => x.Name).OrderBy(x => x).ToArray());
            Assert.Equal("bar", node.Children.First(x => x.Name == "foo").Value);
        }

        [Fact]
        public void ServerIpCanBeReturnedAsIpv6()
        {
            var node = Signal("server.ip", Request(), x => x.Add(new Node("version", "ipv6")));
            Assert.True(IPAddress.TryParse(node.Get<string>(), out _));
        }

        [Fact]
        public void ServerIpWithUnknownVersionThrows()
        {
            var ex = Assert.Throws<HyperlambdaException>(() => Signal("server.ip", Request(), x => x.Add(new Node("version", "ipv9"))));
            Assert.Contains("ipv9", ex.Message);
        }

        [Fact]
        public void VerbIsReturned()
        {
            var request = Request();
            request.Verb = "post";
            Assert.Equal("post", Signal("request.verb", request).Value);
        }

        [Fact]
        public void CookiesAreLookedUpByName()
        {
            var request = Request();
            request.Cookies["session"] = "abc";
            Assert.Equal("abc", Signal("request.cookies.get", request, x => x.Value = "session").Value);
            Assert.Null(Signal("request.cookies.get", request, x => x.Value = "missing").Value);
        }

        [Fact]
        public void HeadersAreLookedUpByName()
        {
            var request = Request();
            request.Headers["X-Custom"] = "yes";
            Assert.Equal("yes", Signal("request.headers.get", request, x => x.Value = "X-Custom").Value);
            Assert.Null(Signal("request.headers.get", request, x => x.Value = "X-Missing").Value);
        }

        [Fact]
        public void MimeTypesCanBeAddedAndListed()
        {
            var extension = "." + Guid.NewGuid().ToString("N").Substring(0, 8);
            Signal("mime.add", Request(), x =>
            {
                x.Value = extension;
                x.Add(new Node("", "application/x-magic-test"));
            });
            var listed = Signal("mime.list", Request());
            Assert.Equal("application/x-magic-test", listed.Children.First(x => x.Name == extension).Value);
            Assert.Contains(listed.Children, x => x.Name == "json");
        }
    }
}
