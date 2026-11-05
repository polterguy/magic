/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.puppeteer.tests
{
    /*
     * A fact that only runs when MAGIC_TEST_CHROME points at a Chrome or Chromium executable, since the tests
     * using it start a real browser.
     */
    public sealed class ChromeFactAttribute : FactAttribute
    {
        public static string Executable => Environment.GetEnvironmentVariable("MAGIC_TEST_CHROME");

        public ChromeFactAttribute()
        {
            if (string.IsNullOrEmpty(Executable) || !File.Exists(Executable))
                Skip = "Set MAGIC_TEST_CHROME to a Chrome or Chromium executable to run the browser tests";
        }
    }

    /*
     * Drives a real browser through the slots, against a tiny web server living for as long as the test.
     */
    [Collection(SessionsCollection.Name)]
    public sealed class BrowserSmokeTests : IDisposable
    {
        static readonly byte[] PngHeader = [0x89, (byte)'P', (byte)'N', (byte)'G'];

        const string Home = @"<html><head><title>Smoke home</title></head><body>
<input id=""name"" name=""name"">
<button id=""go"" onclick=""document.getElementById('out').textContent = document.getElementById('name').value"">Go</button>
<select id=""choice""><option value=""a"">A</option><option value=""b"">B</option></select>
<div id=""out""></div>
<a id=""next"" href=""/next"">next</a>
</body></html>";

        const string Next = "<html><head><title>Smoke next</title></head><body><p id=\"here\">next page</p></body></html>";

        readonly HttpListener _listener = new HttpListener();
        readonly string _base;
        readonly ISignaler _signaler = Common.GetSignaler(services =>
            services.AddSingleton<IConfiguration>(new ConfigurationBuilder().Build()));
        string _session;

        public BrowserSmokeTests()
        {
            var port = new Random().Next(20000, 40000);
            _base = $"http://127.0.0.1:{port}/";
            _listener.Prefixes.Add(_base);
            _listener.Start();
            _ = Task.Run(async () =>
            {
                while (_listener.IsListening)
                {
                    try
                    {
                        var context = await _listener.GetContextAsync();
                        var body = Encoding.UTF8.GetBytes(context.Request.Url.AbsolutePath == "/next" ? Next : Home);
                        context.Response.ContentType = "text/html; charset=utf-8";
                        context.Response.OutputStream.Write(body, 0, body.Length);
                        context.Response.Close();
                    }
                    catch (Exception) when (!_listener.IsListening)
                    {
                        // The listener was stopped while waiting.
                    }
                }
            });
        }

        public void Dispose()
        {
            if (_session != null)
                PuppeteerSessions.CloseAsync(_session).GetAwaiter().GetResult();
            _listener.Stop();
            _listener.Close();
            GC.SuppressFinalize(this);
        }

        async Task<Node> Call(string slot, string value, params (string Name, object Value)[] args)
        {
            var node = new Node(slot, value);
            foreach (var (name, argValue) in args)
            {
                node.Add(new Node(name, argValue));
            }
            await _signaler.SignalAsync(slot, node);
            return node;
        }

        async Task Connect()
        {
            var node = new Node("puppeteer.connect");
            node.Add(new Node("executable", ChromeFactAttribute.Executable));
            node.Add(new Node("args", "--no-sandbox --disable-gpu"));
            node.Add(new Node("timeout", 60000));
            await _signaler.SignalAsync("puppeteer.connect", node);
            _session = node.Get<string>();
        }

        [ChromeFact]
        public async Task DrivesARealPage()
        {
            await Connect();
            Assert.False(string.IsNullOrEmpty(_session));

            var url = await Call("puppeteer.goto", _session, ("url", _base), ("wait-until", "load"));
            Assert.StartsWith(_base, url.Get<string>());
            Assert.Equal("Smoke home", (await Call("puppeteer.title", _session)).Get<string>());
            Assert.Contains("id=\"go\"", (await Call("puppeteer.content", _session)).Get<string>());

            await Call("puppeteer.wait-for-selector", _session, ("selector", "#go"), ("timeout", 10000), ("visible", true));
            await Call("puppeteer.fill", _session, ("selector", "#name"), ("text", "first"));
            await Call("puppeteer.type", _session, ("selector", "#name"), ("text", " second"));
            await Call("puppeteer.click", _session, ("selector", "#go"));
            // A real page hands strings back as JSON elements, so [puppeteer.evaluate] returns them JSON encoded.
            Assert.Equal("\"first second\"", (await Call("puppeteer.evaluate", _session, ("expression", "document.getElementById('out').textContent"))).Get<string>());

            await Call("puppeteer.select", _session, ("selector", "#choice"), ("values", "b"));
            Assert.Equal("\"b\"", (await Call("puppeteer.evaluate", _session, ("expression", "document.getElementById('choice').value"))).Get<string>());

            await Call("puppeteer.press", _session, ("selector", "#name"), ("key", "Backspace"));
            Assert.Equal("\"first secon\"", (await Call("puppeteer.evaluate", _session, ("expression", "document.getElementById('name').value"))).Get<string>());

            var sum = await Call("puppeteer.evaluate", _session, ("expression", "(a, b) => a + b"), ("args", "x y"));
            Assert.Equal("\"xy\"", sum.Get<string>());

            await Call("puppeteer.click", _session, ("selector", "#next"));
            await Call("puppeteer.wait-for-url", _session, ("url", _base + "next"), ("timeout", 10000));
            Assert.Equal(_base + "next", (await Call("puppeteer.url", _session)).Get<string>());
            Assert.Equal("Smoke next", (await Call("puppeteer.title", _session)).Get<string>());

            var shot = await Call("puppeteer.screenshot", _session, ("filename", "/shots/smoke.png"), ("type", "png"));
            Assert.Equal("/shots/smoke.png", shot.Get<string>());
            Assert.Equal(PngHeader, StubSaveFile.Content.Take(4).ToArray());

            await Call("puppeteer.close", _session);
            Assert.Throws<HyperlambdaException>(() => PuppeteerSessions.Get(_session));
            _session = null;
        }

        [ChromeFact]
        public async Task GotoRefusesFileUrlsInARealSession()
        {
            await Connect();
            await Assert.ThrowsAsync<HyperlambdaException>(() => Call("puppeteer.goto", _session, ("url", "file:///etc/hosts")));
        }
    }
}
