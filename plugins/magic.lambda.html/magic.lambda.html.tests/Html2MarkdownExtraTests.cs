/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Linq;
using Xunit;
using magic.node.extensions;

namespace magic.lambda.html.tests
{
    public class Html2MarkdownExtraTests
    {
        static string Markdown(string html, string args = "")
        {
            var hl = "html2markdown:@\"" + html.Replace("\"", "\"\"") + "\"" + (args == "" ? "" : "\n" + args);
            return Common.Evaluate(hl).Children.First().Get<string>().Replace("\r\n", "\n");
        }

        [Fact]
        public void InlineFormatting()
        {
            var md = Markdown("<p>an <em>emphasised</em>, <b>bold</b> and <strong>strong</strong> word</p>");
            Assert.Contains("*emphasised*", md);
            Assert.Contains("**bold**", md);
            Assert.Contains("**strong**", md);
        }

        [Fact]
        public void BlockquoteIsPrefixed()
        {
            Assert.Contains("> quoted", Markdown("<blockquote>quoted</blockquote>"));
        }

        [Fact]
        public void ListsAreRenderedByDefault()
        {
            var md = Markdown("<ul><li>one</li><li>two</li></ul><ol><li>first</li><li>second</li></ol>");
            Assert.Contains("one", md);
            Assert.Contains("two", md);
            Assert.Contains("first", md);
            Assert.Contains("second", md);
        }

        [Fact]
        public void DisablingListsDropsThem()
        {
            var md = Markdown("<p>before</p><ul><li>one</li><li>two</li></ul><ol><li>first</li></ol>", "   lists:bool:false");
            Assert.Contains("before", md);
            Assert.DoesNotContain("one", md);
            Assert.DoesNotContain("first", md);
        }

        [Fact]
        public void ListItemWithoutTextTraversesInwards()
        {
            var md = Markdown("<ul><li><div><span>nested</span></div></li></ul>");
            Assert.Contains("nested", md);
        }

        [Fact]
        public void CodeIsRenderedByDefault()
        {
            var md = Markdown("<p>use <code>foo()</code></p><pre>line1\nline2</pre>");
            Assert.Contains("`foo()`", md);
            Assert.Contains("line1", md);
        }

        [Fact]
        public void DisablingCodeDropsPreBlocksAndTheBackticks()
        {
            var md = Markdown("<p>use <code>foo()</code></p><pre>block</pre>", "   code:bool:false");
            Assert.DoesNotContain("`foo()`", md);
            Assert.Contains("use foo()", md);
            Assert.DoesNotContain("block", md);
        }

        [Fact]
        public void FormControlsAreIgnored()
        {
            var md = Markdown("<p>before</p><select><option>chosen</option></select><textarea>typed</textarea><p>after</p>");
            Assert.Contains("before", md);
            Assert.Contains("after", md);
            Assert.DoesNotContain("chosen", md);
            Assert.DoesNotContain("typed", md);
        }

        [Fact]
        public void LinkFragmentsAreStripped()
        {
            var md = Markdown("<p><a href=\"https://example.com/page#section\">link</a></p>");
            Assert.Contains("[link](https://example.com/page)", md);
        }

        [Fact]
        public void HtmlEntitiesAreDecoded()
        {
            var md = Markdown("<p>fish &amp; chips &lt;3</p>");
            Assert.Contains("fish & chips <3", md);
        }

        [Fact]
        public void LineBreaksBecomeSpaces()
        {
            Assert.Contains("one two", Markdown("<p>one<br>two</p>"));
        }
    }
}
