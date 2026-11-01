/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Xunit;
using PuppeteerSharp;
using PuppeteerSharp.Input;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.puppeteer.tests
{
    /*
     * Stands in for [io.stream.save-file], recording what a screenshot was saved as.
     */
    [Slot(Name = "io.stream.save-file")]
    public class StubSaveFile : ISlot
    {
        public static string Filename { get; set; }
        public static byte[] Content { get; set; }

        public void Signal(ISignaler signaler, Node input)
        {
            Filename = input.GetEx<string>();
            var stream = input.Children.First().Get<Stream>();
            using var memory = new MemoryStream();
            stream.CopyTo(memory);
            Content = memory.ToArray();
        }
    }

    [Collection(SessionsCollection.Name)]
    public class SlotTests : IDisposable
    {
        static readonly WaitUntilNavigation[] NetworkIdle0 = [WaitUntilNavigation.Networkidle0];
        static readonly string[] SelectAB = ["a", "b"];
        static readonly string[] SelectXY = ["x", "y"];
        static readonly int[] Numbers = [1, 2];
        static readonly byte[] ShotBytes = [1, 2, 3, 4];

        readonly FakeSession _session = new FakeSession();

        readonly ISignaler _signaler = Common.GetSignaler(services =>
            services.AddSingleton<IConfiguration>(new ConfigurationBuilder()
                .AddInMemoryCollection(new System.Collections.Generic.Dictionary<string, string> { ["secrets:password"] = "from-config" })
                .Build()));

        public void Dispose()
        {
            _session.Dispose();
            GC.SuppressFinalize(this);
        }

        Mock<IPage> Page => _session.Page;

        async Task<Node> Call(string slot, string value, params (string Name, object Value)[] args)
        {
            var node = new Node(slot, value ?? _session.Id);
            foreach (var (name, argValue) in args)
            {
                node.Add(new Node(name, argValue));
            }
            await _signaler.SignalAsync(slot, node);
            return node;
        }

        #region [ -- goto -- ]

        [Fact]
        public async Task GotoNavigatesAndReturnsTheFinalUrl()
        {
            var response = new Mock<IResponse>();
            response.SetupGet(x => x.Url).Returns("https://example.com/final");
            NavigationOptions captured = null;
            Page.Setup(x => x.GoToAsync("https://example.com/start", It.IsAny<NavigationOptions>()))
                .Callback((string _, NavigationOptions o) => captured = o)
                .ReturnsAsync(response.Object);

            var node = await Call("puppeteer.goto", null, ("url", "https://example.com/start"), ("timeout", 5000), ("wait-until", "networkidle0"));

            Assert.Equal("https://example.com/final", node.Value);
            Assert.Empty(node.Children);
            Assert.Equal(5000, captured.Timeout);
            Assert.Equal(NetworkIdle0, captured.WaitUntil);
            Assert.Equal("https://example.com", captured.Referer);
            Assert.Equal("strict-origin-when-cross-origin", captured.ReferrerPolicy);
        }

        [Fact]
        public async Task GotoFallsBackToPageUrlWithoutResponse()
        {
            Page.Setup(x => x.GoToAsync(It.IsAny<string>(), It.IsAny<NavigationOptions>())).ReturnsAsync((IResponse)null);
            Page.SetupGet(x => x.Url).Returns("https://example.com/page");
            var node = await Call("puppeteer.goto", null, ("url", "https://example.com/x"));
            Assert.Equal("https://example.com/page", node.Value);
        }

        [Theory]
        [InlineData("file:///etc/passwd")]
        [InlineData("javascript:alert(1)")]
        [InlineData("ftp://example.com/x")]
        [InlineData("not a url")]
        public async Task GotoOnlyAllowsHttpAndHttps(string url)
        {
            var ex = await Assert.ThrowsAsync<HyperlambdaException>(() => Call("puppeteer.goto", null, ("url", url)));
            Assert.Contains("Only http:// and https://", ex.Message);
            Page.Verify(x => x.GoToAsync(It.IsAny<string>(), It.IsAny<NavigationOptions>()), Times.Never);
        }

        [Fact]
        public async Task GotoRequiresUrlAndSession()
        {
            await Assert.ThrowsAsync<HyperlambdaException>(() => Call("puppeteer.goto", null));
            await Assert.ThrowsAsync<HyperlambdaException>(() => Call("puppeteer.goto", "no-such-session", ("url", "https://example.com")));
        }

        #endregion

        #region [ -- click, type, fill, press, select -- ]

        [Fact]
        public async Task ClickPassesOptions()
        {
            ClickOptions captured = null;
            Page.Setup(x => x.ClickAsync("#go", It.IsAny<ClickOptions>()))
                .Callback((string _, ClickOptions o) => captured = o)
                .Returns(Task.CompletedTask);
            var node = await Call("puppeteer.click", null, ("selector", "#go"), ("button", "right"), ("click-count", 2), ("delay", 10));
            Assert.Null(node.Value);
            Assert.Equal(MouseButton.Right, captured.Button);
            Assert.Equal(2, captured.Count);
            Assert.Equal(10, captured.Delay);
        }

        [Fact]
        public async Task ClickDefaultsToLeftButton()
        {
            ClickOptions captured = null;
            Page.Setup(x => x.ClickAsync(It.IsAny<string>(), It.IsAny<ClickOptions>()))
                .Callback((string _, ClickOptions o) => captured = o)
                .Returns(Task.CompletedTask);
            await Call("puppeteer.click", null, ("selector", "#go"));
            Assert.Equal(MouseButton.Left, captured.Button);
        }

        [Fact]
        public async Task ClickRequiresSelectorAndKnownButton()
        {
            await Assert.ThrowsAsync<HyperlambdaException>(() => Call("puppeteer.click", null));
            await Assert.ThrowsAsync<HyperlambdaException>(() => Call("puppeteer.click", null, ("selector", "#a"), ("button", "thumb")));
        }

        [Fact]
        public async Task TypeTypesText()
        {
            TypeOptions captured = null;
            Page.Setup(x => x.TypeAsync("#name", "john", It.IsAny<TypeOptions>()))
                .Callback((string _, string _, TypeOptions o) => captured = o)
                .Returns(Task.CompletedTask);
            await Call("puppeteer.type", null, ("selector", "#name"), ("text", "john"), ("delay", 25));
            Assert.Equal(25, captured.Delay);
        }

        [Fact]
        public async Task TypeCanTakeTextFromConfiguration()
        {
            Page.Setup(x => x.TypeAsync("#pw", "from-config", It.IsAny<TypeOptions>())).Returns(Task.CompletedTask);
            await Call("puppeteer.type", null, ("selector", "#pw"), ("config-key", "secrets:password"));
            Page.Verify(x => x.TypeAsync("#pw", "from-config", It.IsAny<TypeOptions>()), Times.Once);
        }

        [Fact]
        public async Task TypeRequiresTextOrConfigKey()
        {
            await Assert.ThrowsAsync<HyperlambdaException>(() => Call("puppeteer.type", null, ("selector", "#a")));
            await Assert.ThrowsAsync<HyperlambdaException>(() => Call("puppeteer.type", null, ("selector", "#a"), ("text", "x"), ("config-key", "y")));
        }

        [Fact]
        public async Task FillClearsTheFieldBeforeTyping()
        {
            string script = null;
            Page.Setup(x => x.EvaluateExpressionAsync(It.IsAny<string>()))
                .Callback((string s) => script = s)
                .Returns(Task.CompletedTask);
            Page.Setup(x => x.TypeAsync("input[name=\"q\"]", "hello", It.IsAny<TypeOptions>())).Returns(Task.CompletedTask);
            await Call("puppeteer.fill", null, ("selector", "input[name=\"q\"]"), ("text", "hello"));
            Assert.Contains("value = ''", script);
            Assert.Contains("input[name=\\u0022q\\u0022]", script);
            Assert.DoesNotContain("[name=\"q\"]", script);
            Page.Verify(x => x.TypeAsync("input[name=\"q\"]", "hello", It.IsAny<TypeOptions>()), Times.Once);
        }

        [Fact]
        public async Task FillCanTakeTextFromConfiguration()
        {
            Page.Setup(x => x.EvaluateExpressionAsync(It.IsAny<string>())).Returns(Task.CompletedTask);
            Page.Setup(x => x.TypeAsync("#pw", "from-config", It.IsAny<TypeOptions>())).Returns(Task.CompletedTask);
            await Call("puppeteer.fill", null, ("selector", "#pw"), ("config-key", "secrets:password"));
            Page.Verify(x => x.TypeAsync("#pw", "from-config", It.IsAny<TypeOptions>()), Times.Once);
        }

        [Fact]
        public async Task PressFocusesThenPressesTheKey()
        {
            var keyboard = new Mock<IKeyboard>();
            keyboard.Setup(x => x.PressAsync("Enter", It.IsAny<PressOptions>())).Returns(Task.CompletedTask);
            Page.SetupGet(x => x.Keyboard).Returns(keyboard.Object);
            Page.Setup(x => x.FocusAsync("#q")).Returns(Task.CompletedTask);
            await Call("puppeteer.press", null, ("selector", "#q"), ("key", "Enter"), ("delay", 5));
            Page.Verify(x => x.FocusAsync("#q"), Times.Once);
            keyboard.Verify(x => x.PressAsync("Enter", It.Is<PressOptions>(o => o.Delay == 5)), Times.Once);
        }

        [Fact]
        public async Task PressRequiresKey()
        {
            var ex = await Assert.ThrowsAsync<HyperlambdaException>(() => Call("puppeteer.press", null, ("selector", "#q")));
            Assert.Contains("[key]", ex.Message);
        }

        [Fact]
        public async Task SelectChoosesValues()
        {
            Page.Setup(x => x.SelectAsync("#s", It.IsAny<string[]>())).ReturnsAsync(["a", "b"]);
            var values = new Node("values", null, [new Node(".", "a"), new Node(".", "b")]);
            var node = new Node("puppeteer.select", _session.Id, [new Node("selector", "#s"), values]);
            await _signaler.SignalAsync("puppeteer.select", node);
            Page.Verify(x => x.SelectAsync("#s", It.Is<string[]>(v => v.SequenceEqual(SelectAB))), Times.Once);
        }

        [Fact]
        public async Task SelectAcceptsCommaSeparatedValues()
        {
            Page.Setup(x => x.SelectAsync("#s", It.IsAny<string[]>())).ReturnsAsync(["x"]);
            await Call("puppeteer.select", null, ("selector", "#s"), ("values", "x, y"));
            Page.Verify(x => x.SelectAsync("#s", It.Is<string[]>(v => v.SequenceEqual(SelectXY))), Times.Once);
        }

        [Fact]
        public async Task SelectRequiresValues()
        {
            await Assert.ThrowsAsync<HyperlambdaException>(() => Call("puppeteer.select", null, ("selector", "#s")));
        }

        #endregion

        #region [ -- evaluate and readers -- ]

        [Fact]
        public async Task EvaluateReturnsStringsAsTheyAre()
        {
            Page.Setup(x => x.EvaluateExpressionAsync<object>("document.title")).ReturnsAsync("hello");
            Assert.Equal("hello", (await Call("puppeteer.evaluate", null, ("expression", "document.title"))).Value);
        }

        [Fact]
        public async Task EvaluateSerialisesOtherResultsAsJson()
        {
            Page.Setup(x => x.EvaluateExpressionAsync<object>("1+1")).ReturnsAsync(Numbers);
            Assert.Equal("[1,2]", (await Call("puppeteer.evaluate", null, ("expression", "1+1"))).Value);
        }

        [Fact]
        public async Task EvaluateReturnsNullForNull()
        {
            Page.Setup(x => x.EvaluateExpressionAsync<object>("null")).ReturnsAsync((object)null);
            Assert.Null((await Call("puppeteer.evaluate", null, ("expression", "null"))).Value);
        }

        [Fact]
        public async Task EvaluateWithArgumentsCallsAFunction()
        {
            Page.Setup(x => x.EvaluateFunctionAsync<object>("(a, b) => a + b", It.IsAny<object[]>())).ReturnsAsync("ab");
            var args = new Node("args", null, [new Node(".", "a"), new Node(".", "b")]);
            var node = new Node("puppeteer.evaluate", _session.Id, [new Node("expression", "(a, b) => a + b"), args]);
            await _signaler.SignalAsync("puppeteer.evaluate", node);
            Assert.Equal("ab", node.Value);
            Page.Verify(x => x.EvaluateFunctionAsync<object>("(a, b) => a + b", It.Is<object[]>(o => o.Length == 2)), Times.Once);
        }

        [Fact]
        public async Task ContentTitleAndUrlAreRead()
        {
            Page.Setup(x => x.GetContentAsync()).ReturnsAsync("<html></html>");
            Page.Setup(x => x.GetTitleAsync()).ReturnsAsync("A title");
            Page.SetupGet(x => x.Url).Returns("https://example.com/now");
            Assert.Equal("<html></html>", (await Call("puppeteer.content", null)).Value);
            Assert.Equal("A title", (await Call("puppeteer.title", null)).Value);
            Assert.Equal("https://example.com/now", (await Call("puppeteer.url", null)).Value);
        }

        #endregion

        #region [ -- waiting -- ]

        [Fact]
        public async Task WaitForSelectorPassesOptions()
        {
            WaitForSelectorOptions captured = null;
            Page.Setup(x => x.WaitForSelectorAsync("#late", It.IsAny<WaitForSelectorOptions>()))
                .Callback((string _, WaitForSelectorOptions o) => captured = o)
                .ReturnsAsync((IElementHandle)null);
            await Call("puppeteer.wait-for-selector", null, ("selector", "#late"), ("timeout", 3000), ("visible", true), ("hidden", false));
            Assert.Equal(3000, captured.Timeout);
            Assert.True(captured.Visible);
            Assert.False(captured.Hidden);
        }

        [Fact]
        public async Task WaitForSelectorWithoutOptions()
        {
            Page.Setup(x => x.WaitForSelectorAsync("#late", It.IsAny<WaitForSelectorOptions>())).ReturnsAsync((IElementHandle)null);
            await Call("puppeteer.wait-for-selector", null, ("selector", "#late"));
            Page.Verify(x => x.WaitForSelectorAsync("#late", It.IsAny<WaitForSelectorOptions>()), Times.Once);
        }

        [Fact]
        public async Task WaitForUrlWaitsForTheLocation()
        {
            WaitForFunctionOptions captured = null;
            Page.Setup(x => x.WaitForFunctionAsync("url => window.location.href === url", It.IsAny<WaitForFunctionOptions>(), It.IsAny<object[]>()))
                .Callback((string _, WaitForFunctionOptions o, object[] _) => captured = o)
                .ReturnsAsync((IJSHandle)null);
            await Call("puppeteer.wait-for-url", null, ("url", "https://example.com/done"), ("timeout", 1500));
            Assert.Equal(1500, captured.Timeout);
        }

        [Fact]
        public async Task WaitForUrlRequiresUrl()
        {
            await Assert.ThrowsAsync<HyperlambdaException>(() => Call("puppeteer.wait-for-url", null));
        }

        #endregion

        #region [ -- screenshot and close -- ]

        [Theory]
        [InlineData("png", ScreenshotType.Png)]
        [InlineData("JPEG", ScreenshotType.Jpeg)]
        [InlineData("jpg", ScreenshotType.Jpeg)]
        public async Task ScreenshotIsSavedThroughTheStreamSlot(string type, ScreenshotType expected)
        {
            ScreenshotOptions captured = null;
            Page.Setup(x => x.ScreenshotDataAsync(It.IsAny<ScreenshotOptions>()))
                .Callback((ScreenshotOptions o) => captured = o)
                .ReturnsAsync(ShotBytes);
            var node = await Call("puppeteer.screenshot", null, ("filename", "/shots/a.img"), ("type", type), ("quality", 70), ("full-page", true));
            Assert.Equal("/shots/a.img", node.Value);
            Assert.Equal("/shots/a.img", StubSaveFile.Filename);
            Assert.Equal(ShotBytes, StubSaveFile.Content);
            Assert.Equal(expected, captured.Type);
            Assert.Equal(70, captured.Quality);
            Assert.True(captured.FullPage);
        }

        [Fact]
        public async Task ScreenshotRejectsUnknownTypeAndMissingFilename()
        {
            await Assert.ThrowsAsync<HyperlambdaException>(() => Call("puppeteer.screenshot", null, ("filename", "/a.gif"), ("type", "gif")));
            await Assert.ThrowsAsync<HyperlambdaException>(() => Call("puppeteer.screenshot", null));
        }

        [Fact]
        public async Task CloseEndsTheSession()
        {
            var node = await Call("puppeteer.close", null);
            Assert.Null(node.Value);
            Assert.Throws<HyperlambdaException>(() => PuppeteerSessions.Get(_session.Id));
            Page.Verify(x => x.CloseAsync(It.IsAny<PageCloseOptions>()), Times.Once);
        }

        [Fact]
        public async Task CloseTakesTheSessionFromAChildToo()
        {
            var node = new Node("puppeteer.close", null, [new Node("session_id", _session.Id)]);
            await _signaler.SignalAsync("puppeteer.close", node);
            Assert.Throws<HyperlambdaException>(() => PuppeteerSessions.Get(_session.Id));
        }

        [Fact]
        public async Task CloseRequiresASessionId()
        {
            await Assert.ThrowsAsync<HyperlambdaException>(() => _signaler.SignalAsync("puppeteer.close", new Node("puppeteer.close")));
        }

        #endregion
    }
}
