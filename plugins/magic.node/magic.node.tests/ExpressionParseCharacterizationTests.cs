/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using Xunit;
using magic.node.extensions;

namespace magic.node.tests
{
    /*
     * Characterization tests for how Expression splits its text into iterators.
     *
     * These pin the CURRENT behaviour, quirks included, such that the parser can be rewritten without
     * changing what any expression means. A failing test here is not necessarily a bug in the test.
     */
    public class ExpressionParseCharacterizationTests
    {
        [Theory]
        [InlineData("foo", new string[] { "foo" }, "foo")]
        [InlineData("foo/bar", new string[] { "foo", "bar" }, "foo/bar")]
        [InlineData("", new string[] { "" }, "")]
        [InlineData("/", new string[] { "", "" }, "/")]
        [InlineData("foo/", new string[] { "foo", "" }, "foo/")]
        [InlineData("/foo", new string[] { "", "foo" }, "/foo")]
        [InlineData("foo//bar", new string[] { "foo", "", "bar" }, "foo//bar")]
        [InlineData("\"foo/bar\"/baz", new string[] { "foo/bar", "baz" }, "\"foo/bar\"/baz")]
        [InlineData("\"a\"b", new string[] { "ab" }, "ab")]
        [InlineData("x\"y\"", new string[] { "x\"y\"" }, "x\"y\"")]
        [InlineData("{@foo}/bar", new string[] { "{@foo}", "bar" }, "{@foo}/bar")]
        [InlineData("foo/{@a/b}", new string[] { "foo", "{@a/b}" }, "foo/\"{@a/b}\"")]
        [InlineData("{{@x}}", new string[] { "{{@x}}" }, "{{@x}}")]
        [InlineData("{@a/{@b}}", new string[] { "{@a/{@b}}" }, "\"{@a/{@b}}\"")]
        [InlineData("@.arguments/*/name", new string[] { "@.arguments", "*", "name" }, "@.arguments/*/name")]
        [InlineData("..", new string[] { ".." }, "..")]
        [InlineData("**", new string[] { "**" }, "**")]
        [InlineData("-", new string[] { "-" }, "-")]
        [InlineData("+", new string[] { "+" }, "+")]
        [InlineData("[0,1]", new string[] { "[0,1]" }, "[0,1]")]
        [InlineData("[a|b]", new string[] { "[a|b]" }, "[a|b]")]
        [InlineData("=foo", new string[] { "=foo" }, "=foo")]
        [InlineData("=\"x/y\"", new string[] { "=\"x", "y\"" }, "=\"x/y\"")]
        [InlineData("\u00e6/\u00f8", new string[] { "\u00e6", "\u00f8" }, "\u00e6/\u00f8")]
        [InlineData(" foo / bar ", new string[] { " foo ", " bar " }, " foo / bar ")]
        [InlineData("foo/\"bar\"/baz", new string[] { "foo", "bar", "baz" }, "foo/bar/baz")]
        [InlineData("\"a\\\"b\"/c", new string[] { "a\"b", "c" }, "a\"b/c")]
        [InlineData("foo/\"\"/bar", new string[] { "foo", "", "bar" }, "foo//bar")]
        [InlineData("{}", new string[] { "{}" }, "{}")]
        [InlineData("a/{@b}/c/{@d}", new string[] { "a", "{@b}", "c", "{@d}" }, "a/{@b}/c/{@d}")]
        [InlineData("\"a\"", new string[] { "a" }, "a")]
        [InlineData("\"a/b\"", new string[] { "a/b" }, "\"a/b\"")]
        [InlineData("foo/\"a/b\"", new string[] { "foo", "a/b" }, "foo/\"a/b\"")]
        [InlineData("{@a}{@b}", new string[] { "{@a}", "{@b}" }, "{@a}/{@b}")]
        [InlineData("a{@b}", new string[] { "a{@b}" }, "a{@b}")]
        [InlineData("{@a}b", new string[] { "{@a}", "b" }, "{@a}/b")]
        [InlineData("{@a/\"b/c\"}", new string[] { "{@a/\"b/c\"}" }, "\"{@a/\"b/c\"}\"")]
        [InlineData("{\"a/b\"}", new string[] { "{\"a/b\"}" }, "\"{\"a/b\"}\"")]
        [InlineData("*/foo", new string[] { "*", "foo" }, "*/foo")]
        [InlineData("**/foo/*", new string[] { "**", "foo", "*" }, "**/foo/*")]
        [InlineData("=a/b", new string[] { "=a", "b" }, "=a/b")]
        [InlineData("[0,1]/foo", new string[] { "[0,1]", "foo" }, "[0,1]/foo")]
        [InlineData("foo/{@bar}/[0,1]", new string[] { "foo", "{@bar}", "[0,1]" }, "foo/{@bar}/[0,1]")]
        [InlineData("\\", new string[] { "\\" }, "\\")]
        [InlineData("a\\b", new string[] { "a\\b" }, "a\\b")]
        [InlineData("\"a\\nb\"", new string[] { "a\nb" }, "a\nb")]
        [InlineData("a b/c d", new string[] { "a b", "c d" }, "a b/c d")]
        [InlineData("  ", new string[] { "  " }, "  ")]
        [InlineData("\t", new string[] { "\t" }, "\t")]
        [InlineData("foo/\n/bar", new string[] { "foo", "\n", "bar" }, "foo/\n/bar")]
        [InlineData("={@a}", new string[] { "={@a}" }, "={@a}")]
        [InlineData("={@a}/b", new string[] { "={@a}", "b" }, "={@a}/b")]
        [InlineData("={@a}b", new string[] { "={@a}", "b" }, "={@a}/b")]
        [InlineData("={{@a}}", new string[] { "={{@a}}" }, "={{@a}}")]
        [InlineData("\"=\"{@a}", new string[] { "={@a}" }, "={@a}")]
        [InlineData("{@a}/", new string[] { "{@a}", "" }, "{@a}/")]
        [InlineData("{@a}/{@b}", new string[] { "{@a}", "{@b}" }, "{@a}/{@b}")]
        [InlineData("{@a}//b", new string[] { "{@a}", "", "b" }, "{@a}//b")]
        [InlineData("\"\"\"x\"", new string[] { "x" }, "x")]
        [InlineData("\"\"\"\"", new string[] { "" }, "")]
        [InlineData("\"a\\@b\"", new string[] { "a\\@b" }, "a\\@b")]
        [InlineData("{@a}}", new string[] { "{@a}", "}" }, "{@a}/}")]
        [InlineData("{@a}\"x/y\"", new string[] { "{@a}", "x/y" }, "{@a}/\"x/y\"")]
        [InlineData("\"x\"{@a}", new string[] { "x{@a}" }, "x{@a}")]
        [InlineData("a/\"\"/{@b}", new string[] { "a", "", "{@b}" }, "a//{@b}")]
        [InlineData("\"a\"\"b\"", new string[] { "a\"b\"" }, "a\"b\"")]
        [InlineData("\"\"", new string[] { "" }, "")]
        [InlineData("\"\"/x", new string[] { "", "x" }, "/x")]
        [InlineData("=", new string[] { "=" }, "=")]
        [InlineData("=\"{@a}\"", new string[] { "=\"{@a}\"" }, "=\"{@a}\"")]
        [InlineData("\ufefffoo", new string[] { "foo" }, "foo")]
        [InlineData("\ufeff", new string[] { "" }, "")]
        [InlineData("x/\ufeff/y", new string[] { "x", "\ufeff", "y" }, "x/\ufeff/y")]
        [InlineData("{ }", new string[] { "{ }" }, "{ }")]
        public void Splits_Into_Iterators(string expression, string[] iterators, string value)
        {
            var x = new Expression(expression);
            Assert.Equal(iterators, x.Iterators.Select(i => i.Value).ToArray());
            Assert.Equal(value, x.Value);
        }

        [Theory]
        [InlineData("{foo", "HyperlambdaException")]
        [InlineData("\"unclosed", "HyperlambdaException")]
        [InlineData("foo/{unclosed", "HyperlambdaException")]
        [InlineData("\"a\\qb\"", "HyperlambdaException")]
        [InlineData("={", "HyperlambdaException")]
        [InlineData("{@a/\"}\"}", "HyperlambdaException")]
        public void Malformed_Throws(string expression, string exceptionType)
        {
            var exception = Record.Exception(() => new Expression(expression));
            Assert.NotNull(exception);
            Assert.Equal(exceptionType, exception.GetType().Name);
        }
    }
}
