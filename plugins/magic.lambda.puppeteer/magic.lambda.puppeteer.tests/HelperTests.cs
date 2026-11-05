/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System;
using System.Linq;
using Microsoft.Extensions.Configuration;
using Xunit;
using PuppeteerSharp;
using PuppeteerSharp.Input;
using magic.node;
using magic.node.extensions;

namespace magic.lambda.puppeteer.tests
{
    public class HelperTests
    {
        static readonly string[] ArgsAB = ["--a", "--b=1"];
        static readonly string[] ArgsQuoted = ["--a", "two words", "single q", "it\"s ok", "plain"];
        static readonly string[] ValuesAB = ["a", "b"];
        static readonly string[] ValuesABC = ["a", "b", "c"];

        static Node With(string value, params Node[] children) => new Node("x", value, children);

        [Fact]
        public void SlotValueComesFromValueOrDotChild()
        {
            Assert.Equal("v", PuppeteerHelpers.GetSlotValue(With("v")));
            Assert.Equal("child", PuppeteerHelpers.GetSlotValue(With(null, new Node(".", "child"))));
            Assert.Null(PuppeteerHelpers.GetSlotValue(With(null)));
        }

        [Fact]
        public void RequiredValueRejectsEmpty()
        {
            Assert.Equal("v", PuppeteerHelpers.GetRequiredValue(With("v"), "puppeteer.x"));
            var ex = Assert.Throws<HyperlambdaException>(() => PuppeteerHelpers.GetRequiredValue(With("  "), "puppeteer.x"));
            Assert.Contains("[puppeteer.x]", ex.Message);
            Assert.Throws<HyperlambdaException>(() => PuppeteerHelpers.GetRequiredValue(With(null), "puppeteer.x"));
        }

        [Fact]
        public void RequiredAndOptionalStrings()
        {
            var node = With(null, new Node("selector", "#a"), new Node("blank", " "));
            Assert.Equal("#a", PuppeteerHelpers.GetRequiredString(node, "selector"));
            Assert.Equal("#a", PuppeteerHelpers.GetOptionalString(node, "selector"));
            Assert.Null(PuppeteerHelpers.GetOptionalString(node, "missing"));
            Assert.Throws<HyperlambdaException>(() => PuppeteerHelpers.GetRequiredString(node, "missing"));
            Assert.Throws<HyperlambdaException>(() => PuppeteerHelpers.GetRequiredString(node, "blank"));
        }

        [Fact]
        public void SessionIdFromValueOrChild()
        {
            Assert.Equal("abc", PuppeteerHelpers.GetRequiredSessionId(With("abc"), allowValue: true));
            Assert.Equal("def", PuppeteerHelpers.GetRequiredSessionId(With(null, new Node("session_id", "def"))));
            Assert.Equal("def", PuppeteerHelpers.GetRequiredSessionId(With("abc", new Node("session_id", "def")), allowValue: false));
            Assert.Equal("def", PuppeteerHelpers.GetRequiredSessionId(With(" ", new Node("session_id", "def")), allowValue: true));
            var ex = Assert.Throws<HyperlambdaException>(() => PuppeteerHelpers.GetRequiredSessionId(With("abc"), allowValue: false));
            Assert.Contains("[session_id]", ex.Message);
        }

        [Fact]
        public void RequiredIntFromValueOrDotChild()
        {
            Assert.Equal(5, PuppeteerHelpers.GetRequiredInt(new Node("x", 5), "x"));
            Assert.Equal(7, PuppeteerHelpers.GetRequiredInt(With(null, new Node(".", 7)), "x"));
            Assert.Throws<HyperlambdaException>(() => PuppeteerHelpers.GetRequiredInt(With(null), "x"));
        }

        [Fact]
        public void OptionalBoolAndInt()
        {
            var node = With(null, new Node("yes", true), new Node("n", 4), new Node("nothing", null));
            Assert.True(PuppeteerHelpers.GetOptionalBool(node, "yes"));
            Assert.Null(PuppeteerHelpers.GetOptionalBool(node, "missing"));
            Assert.Equal(4, PuppeteerHelpers.GetOptionalInt(node, "n"));
            Assert.Null(PuppeteerHelpers.GetOptionalInt(node, "missing"));
            Assert.Null(PuppeteerHelpers.GetOptionalInt(node, "nothing"));
        }

        [Fact]
        public void ArgsFromChildrenSkipBlanks()
        {
            var args = new Node("args", null, [new Node(".", "--a"), new Node(".", " "), new Node(".", "--b=1")]);
            Assert.Equal(ArgsAB, PuppeteerHelpers.GetArgs(args).ToArray());
        }

        [Fact]
        public void ArgsFromTextAreSplitHonouringQuotes()
        {
            var args = new Node("args", "--a  \"two words\" 'single q' \"it\\\"s ok\" plain");
            Assert.Equal(ArgsQuoted, PuppeteerHelpers.GetArgs(args).ToArray());
        }

        [Fact]
        public void ArgsOfNothingAreEmpty()
        {
            Assert.Empty(PuppeteerHelpers.GetArgs(null));
            Assert.Empty(PuppeteerHelpers.GetArgs(new Node("args", "  ")));
        }

        [Fact]
        public void ValuesFromChildrenOrCommaSeparatedText()
        {
            Assert.Empty(PuppeteerHelpers.GetValues(null));
            Assert.Empty(PuppeteerHelpers.GetValues(new Node("values", " ")));
            Assert.Equal(ValuesAB, PuppeteerHelpers.GetValues(new Node("values", null, [new Node(".", "a"), new Node(".", ""), new Node(".", "b")])));
            Assert.Equal(ValuesABC, PuppeteerHelpers.GetValues(new Node("values", "a, b ,,c")));
        }

        [Theory]
        [InlineData("load", WaitUntilNavigation.Load)]
        [InlineData(" DOMContentLoaded ", WaitUntilNavigation.DOMContentLoaded)]
        [InlineData("networkidle0", WaitUntilNavigation.Networkidle0)]
        [InlineData("NetworkIdle2", WaitUntilNavigation.Networkidle2)]
        public void WaitUntilValues(string value, WaitUntilNavigation expected)
        {
            Assert.Equal(expected, PuppeteerHelpers.ParseWaitUntil(value));
        }

        [Fact]
        public void WaitUntilEmptyIsNullAndUnknownThrows()
        {
            Assert.Null(PuppeteerHelpers.ParseWaitUntil(null));
            Assert.Null(PuppeteerHelpers.ParseWaitUntil(" "));
            Assert.Throws<HyperlambdaException>(() => PuppeteerHelpers.ParseWaitUntil("never"));
        }

        [Theory]
        [InlineData(null, MouseButton.Left)]
        [InlineData("left", MouseButton.Left)]
        [InlineData("Middle", MouseButton.Middle)]
        [InlineData(" right ", MouseButton.Right)]
        public void MouseButtons(string value, MouseButton expected)
        {
            Assert.Equal(expected, PuppeteerHelpers.ParseMouseButton(value));
        }

        [Fact]
        public void UnknownMouseButtonThrows()
        {
            Assert.Throws<HyperlambdaException>(() => PuppeteerHelpers.ParseMouseButton("thumb"));
        }

        static IConfiguration Config(string key, string value) =>
            new ConfigurationBuilder().AddInMemoryCollection(new System.Collections.Generic.Dictionary<string, string> { [key] = value }).Build();

        [Fact]
        public void TextOrConfigValue()
        {
            var config = Config("secret:pw", "from-config");
            Assert.Equal("typed", PuppeteerHelpers.GetRequiredTextOrConfigValue(With(null, new Node("text", "typed")), config, "puppeteer.fill"));
            Assert.Equal("from-config", PuppeteerHelpers.GetRequiredTextOrConfigValue(With(null, new Node("config-key", "secret:pw")), config, "puppeteer.fill"));
        }

        [Fact]
        public void TextOrConfigValueErrors()
        {
            var config = Config("blank", " ");
            Assert.Contains("not both", Assert.Throws<HyperlambdaException>(() =>
                PuppeteerHelpers.GetRequiredTextOrConfigValue(With(null, new Node("text", "a"), new Node("config-key", "b")), config, "puppeteer.fill")).Message);
            Assert.Contains("could not resolve", Assert.Throws<HyperlambdaException>(() =>
                PuppeteerHelpers.GetRequiredTextOrConfigValue(With(null, new Node("config-key", "blank")), config, "puppeteer.fill")).Message);
            Assert.Contains("requires either", Assert.Throws<HyperlambdaException>(() =>
                PuppeteerHelpers.GetRequiredTextOrConfigValue(With(null), config, "puppeteer.fill")).Message);
        }
    }
}
