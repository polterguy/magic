/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using Xunit;
using magic.node;
using magic.node.extensions;

namespace magic.lambda.html.tests
{
    public class Html2MarkdownTests
    {
        static readonly string[] TwoUrls = { "https://example.com/docs/intro", "https://example.com/guide/next" };
        static readonly string[] OneUrl = { "https://example.com" };
        static readonly string[] PageUrl = { "https://example.com/page" };

        static Node Convert(string html, string args = "")
        {
            var hl = "html2markdown:@\"" + html.Replace("\"", "\"\"") + "\"" + (args == "" ? "" : "\n" + args);
            return Common.Evaluate(hl).Children.First();
        }

        static string Markdown(string html, string args = "") =>
            Convert(html, args).GetEx<string>().Replace("\r\n", "\n");

        static string[] Urls(Node node) =>
            node.Children.First(x => x.Name == "urls").Children.Select(x => x.Get<string>()).ToArray();

        #region [ -- Links -- ]

        [Fact]
        public void LinkWithText()
        {
            Assert.Contains("[The site](https://example.com/page)", Markdown("<p>See <a href=\"https://example.com/page\">The site</a></p>"));
        }

        [Fact]
        public void RelativeLinksAreResolvedAgainstTheDocumentUrl()
        {
            var node = Convert("<a href=\"/docs/intro\">Intro</a><a href=\"next\">Next</a>", "   url:\"https://example.com/guide/start\"");
            var markdown = node.GetEx<string>();
            Assert.Contains("[Intro](https://example.com/docs/intro)", markdown);
            Assert.Contains("[Next](https://example.com/guide/next)", markdown);
            Assert.Equal(TwoUrls, Urls(node));
        }

        [Fact]
        public void BaseElementDecidesWhatRelativeLinksAreRelativeTo()
        {
            var markdown = Markdown("<html><head><base href=\"https://cdn.example.org/assets/\"></head><body><a href=\"x.html\">X</a></body></html>", "   url:\"https://example.com/\"");
            Assert.Contains("(https://cdn.example.org/assets/x.html)", markdown);
        }

        [Fact]
        public void ProtocolRelativeLinks()
        {
            Assert.Contains("(//cdn.example.com/x)".Replace("//", "https://"), Markdown("<a href=\"//cdn.example.com/x\">X</a>"));
            Assert.Contains("(http://cdn.example.com/x)", Markdown("<a href=\"//cdn.example.com/x\">X</a>", "   url:\"http://example.com/\""));
        }

        [Fact]
        public void LinksWithoutADocumentUrlAreLeftAlone()
        {
            Assert.Contains("(relative/page)", Markdown("<a href=\"relative/page\">Page</a>"));
            Assert.Contains("[Top](/)", Markdown("<a href=\"#top\">Top</a>"));
        }

        [Fact]
        public void MailAndPhoneLinksAreNotCollectedAsUrls()
        {
            var node = Convert("<a href=\"mailto:a@b.c\">Mail</a><a href=\"tel:+4512345678\">Call</a><a href=\"https://example.com\">Web</a>");
            Assert.Equal(OneUrl, Urls(node));
            Assert.Contains("[Mail](mailto:a@b.c)", node.GetEx<string>());
        }

        [Fact]
        public void FragmentsAreRemovedFromCollectedUrls()
        {
            var node = Convert("<a href=\"https://example.com/page#section\">Page</a>");
            Assert.Equal(PageUrl, Urls(node));
        }

        [Fact]
        public void LinksThatGoNowhereAreDropped()
        {
            var markdown = Markdown("<p>Text <a href=\"javascript:void(0)\">js</a> and <a href=\"#\">hash</a> and <a>none</a></p>");
            Assert.DoesNotContain("](", markdown);
            Assert.Contains("Text", markdown);
        }

        [Fact]
        public void LinkWithoutTextIsCalledLink()
        {
            Assert.Contains("[link](https://example.com)", Markdown("<a href=\"https://example.com\"></a>"));
        }

        [Fact]
        public void LinkWithOnlyAnImageUsesTheImage()
        {
            var markdown = Markdown("<a href=\"https://example.com\"><img src=\"https://example.com/p.png\" alt=\"Picture\"></a>");
            Assert.Contains("[![Picture](https://example.com/p.png)](https://example.com)", markdown);
        }

        [Fact]
        public void LinkWithSeveralTextPartsJoinsThemWithASpace()
        {
            Assert.Contains("[One Two](https://example.com)", Markdown("<a href=\"https://example.com\"><span>One</span><span>Two</span></a>"));
        }

        #endregion

        #region [ -- Images -- ]

        [Fact]
        public void ImageWithAndWithoutAlternativeText()
        {
            var markdown = Markdown("<img src=\"https://example.com/a.png\" alt=\"Alt text\"><img src=\"https://example.com/b.png\" alt=\"\"><img src=\"https://example.com/c.png\">");
            Assert.Contains("![Alt text](https://example.com/a.png)", markdown);
            Assert.Contains("![Image](https://example.com/b.png)", markdown);
            Assert.Contains("![Image](https://example.com/c.png)", markdown);
        }

        [Fact]
        public void ImagesCanBeLeftOut()
        {
            Assert.DoesNotContain("![", Markdown("<p>Text</p><img src=\"https://example.com/a.png\" alt=\"x\">", "   images:bool:false"));
        }

        #endregion

        #region [ -- Text -- ]

        [Fact]
        public void HeadingsAndEmphasis()
        {
            var markdown = Markdown("<h1>Title</h1><h2>Sub</h2><p>Some <strong>bold</strong>, <b>bold too</b>, <em>emphasis</em> and <i>italic</i></p>");
            Assert.Contains("# Title", markdown);
            Assert.Contains("## Sub", markdown);
            Assert.Contains("**bold**", markdown);
            Assert.Contains("**bold too**", markdown);
            Assert.Contains("*emphasis*", markdown);
            Assert.Contains("*italic*", markdown);
        }

        [Fact]
        public void ListItems()
        {
            var markdown = Markdown("<ul><li>One</li><li>Two <b>bold</b></li><li><p>Three</p></li></ul>");
            Assert.Contains("* One", markdown);
            Assert.Contains("* Two", markdown);
            Assert.Contains("Three", markdown);
        }

        [Fact]
        public void BlocksAreSeparatedByBlankLines()
        {
            var markdown = Markdown("<div><p>First</p><p>Second</p></div><section><span>Third</span></section><nav>Fourth</nav>");
            Assert.Contains("First", markdown);
            Assert.Matches("First\\s*\\n\\s*\\n\\s*Second", markdown);
            Assert.Contains("Third", markdown);
            Assert.Contains("Fourth", markdown);
        }

        [Fact]
        public void LineBreaks()
        {
            var markdown = Markdown("<p>One<br>Two<br/>Three</p>");
            Assert.Contains("One", markdown);
            Assert.Contains("Three", markdown);
        }

        [Fact]
        public void UnknownElementsKeepTheirText()
        {
            Assert.Contains("inside the custom element", Markdown("<div><custom-widget>inside the custom element</custom-widget></div>"));
        }

        [Fact]
        public void NonProseElementsAreDropped()
        {
            var markdown = Markdown("<p>Kept</p><template>t</template><svg><text>s</text></svg><select><option>o</option></select><button>b</button><textarea>ta</textarea><noscript>n</noscript>");
            Assert.Contains("Kept", markdown);
            foreach (var dropped in new[] { "t\n", "svg", "option", "ta", "noscript" })
            {
                Assert.DoesNotContain(dropped == "t\n" ? "template" : dropped, markdown);
            }
        }

        [Fact]
        public void EntitiesAreDecoded()
        {
            Assert.Contains("Tom & Jerry <3", Markdown("<p>Tom &amp; Jerry &lt;3</p>"));
        }

        [Fact]
        public void CurlyBracesAreEscaped()
        {
            Assert.Contains("\\{\\{name\\}\\}", Markdown("<p>Hello {{name}}</p>"));
        }

        #endregion

        #region [ -- Code -- ]

        [Fact]
        public void CodeBlocks()
        {
            var markdown = Markdown("<pre><code>var a = 1;\nvar b = 2;</code></pre>");
            Assert.Contains("```", markdown);
            Assert.Contains("var a = 1;", markdown);
        }

        [Fact]
        public void InlineCodeCanBeTurnedOff()
        {
            Assert.DoesNotContain("`", Markdown("<p>Run <code>npm install</code> now</p>", "   code:bool:false"));
        }

        #endregion

        #region [ -- Tables -- ]

        [Fact]
        public void TableWithHeaderAndBodyAndFooter()
        {
            var markdown = Markdown("<table><caption>Prices</caption><thead><tr><th>Item</th><th>Cost</th></tr></thead><tbody><tr><td>Tea</td><td>2</td></tr></tbody><tfoot><tr><td>Total</td><td>2</td></tr></tfoot></table>");
            Assert.Contains("**Prices**", markdown);
            Assert.Contains("| Item | Cost |", markdown);
            Assert.Contains("| --- | --- |", markdown);
            Assert.Contains("| Tea | 2 |", markdown);
            Assert.Contains("| Total | 2 |", markdown);
        }

        [Fact]
        public void TableWithoutHeaderGetsAnEmptyOne()
        {
            var markdown = Markdown("<table><tr><td>A</td><td>B</td></tr><tr><td>C</td><td>D</td></tr></table>");
            Assert.Contains("|  |  |", markdown);
            Assert.Contains("| A | B |", markdown);
        }

        [Fact]
        public void ColspanIsApproximatedWithPadding()
        {
            var markdown = Markdown("<table><tr><th colspan=\"2\">Wide</th><th>Narrow</th></tr><tr><td>1</td><td>2</td><td>3</td></tr></table>");
            Assert.Contains("| Wide |  | Narrow |", markdown);
        }

        [Fact]
        public void PipesInCellsAreEscaped()
        {
            Assert.Contains("a\\|b", Markdown("<table><tr><td>a|b</td><td>x</td></tr><tr><td>c</td><td>d</td></tr></table>"));
        }

        [Fact]
        public void EmptyCaptionIsLeftOut()
        {
            var markdown = Markdown("<table><caption> </caption><tr><td>A</td><td>B</td></tr><tr><td>C</td><td>D</td></tr></table>");
            Assert.DoesNotContain("****", markdown);
        }

        [Fact]
        public void NestedTablesAreNotTables()
        {
            var markdown = Markdown("<table><tr><td>Outer<table><tr><td>Inner</td><td>x</td></tr><tr><td>y</td><td>z</td></tr></table></td><td>B</td></tr><tr><td>C</td><td>D</td></tr></table>");
            Assert.DoesNotContain("| Outer", markdown);
            Assert.Contains("Outer", markdown);
            Assert.Contains("Inner", markdown);
        }

        [Fact]
        public void LayoutTablesAreProse()
        {
            var essay = new string('x', 160);
            var markdown = Markdown("<table><tr><td>" + essay + "</td><td>B</td></tr><tr><td>C</td><td>D</td></tr></table>");
            Assert.DoesNotContain("| --- |", markdown);
            Assert.Contains(essay, markdown);
        }

        [Fact]
        public void TablesWithOneRowOrOneColumnAreProse()
        {
            Assert.DoesNotContain("| --- |", Markdown("<table><tr><td>A</td><td>B</td></tr></table>"));
            Assert.DoesNotContain("| --- |", Markdown("<table><tr><td>A</td></tr><tr><td>B</td></tr></table>"));
        }

        #endregion

        [Fact]
        public void EmptyDocumentGivesNothingOrWhitespace()
        {
            Assert.True(string.IsNullOrWhiteSpace(Convert("<html><body></body></html>").Value as string));
        }
    }
}
