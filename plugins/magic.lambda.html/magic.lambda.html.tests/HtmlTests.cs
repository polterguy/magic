/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using Xunit;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.html.tests
{
    public class HtmlTests
    {
        [Fact]
        public void FromHtml()
        {
            var result = Common.Evaluate(@"
html2lambda:@""<html>
  <head>
    <title>Foo</title>
  </head>
  <body>
    <p class=""""howdy"""">
  </body>
</html>""");
            Assert.Equal("Foo", new Expression("**/html2lambda/*/*/*/title/*/\\#text").Evaluate(result).First().Value);
            Assert.Equal("howdy", new Expression("**/html2lambda/*/*/*/p/*/\\@class").Evaluate(result).First().Value);
        }

        [Fact]
        public void Lambda2HtmlSignatureDocumentsExpressionOnly()
        {
            var lambda = Common.Evaluate(@"slot.signature:lambda2html");
            var result = lambda.Children.First();
            var input = result.Children.First(x => x.Name == "input");

            Assert.True(input.Children.First(x => x.Name == "required").GetEx<bool>());
            Assert.Equal(SlotValueMode.Expression.ToString(), input.Children.First(x => x.Name == "mode").GetEx<string>());
            Assert.DoesNotContain(result.Children, x => x.Name == "children");
        }

        [Fact]
        public void Html2LambdaSignatureDocumentsLambdaOutput()
        {
            var lambda = Common.Evaluate(@"slot.signature:html2lambda");
            var result = lambda.Children.First();
            var output = result.Children.First(x => x.Name == "output");

            Assert.Equal(SlotReturnsMode.Lambda.ToString(), output.Children.First(x => x.Name == "mode").GetEx<string>());
            Assert.Equal("lambda", output.Children.First(x => x.Name == "type").GetEx<string>());
            Assert.Equal("Resolves to the parsed HTML hierarchy as child nodes", output.Children.First(x => x.Name == "description").GetEx<string>());
        }

        [Fact]
        public void FromMarkdown()
        {
            var result = Common.Evaluate(@"
markdown2html:@""
# Header

howdy
""
html2lambda:x:-");
            Assert.Equal("Header", new Expression("**/html2lambda/*/h1/*/\\#text").Evaluate(result).First().Value);
            Assert.Equal("howdy", new Expression("**/html2lambda/*/p/*/\\#text").Evaluate(result).First().Value);
        }

        [Fact]
        public void FromMarkdownWithFrontMatter()
        {
            var result = Common.Evaluate(@"
markdown2html:@""---
foo: bar
---
# Header

howdy
""
html2lambda:x:-");
            Assert.Equal("Header", new Expression("**/html2lambda/*/h1/*/\\#text").Evaluate(result).First().Value);
            Assert.Equal("howdy", new Expression("**/html2lambda/*/p/*/\\#text").Evaluate(result).First().Value);
            Assert.Equal("bar", new Expression("**/markdown2html/*/foo").Evaluate(result).First().Value);
        }

        [Fact]
        public void Html2MarkdownKeepsSummaryAsHeading()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<html><body><details><summary>Can I self-host?</summary><p>Yes you can.</p></details></body></html>""");
            var markdown = result.Children.First().GetEx<string>();
            Assert.Contains("### Can I self-host?", markdown);
            Assert.Contains("Yes you can.", markdown);
        }

        [Fact]
        public void Html2MarkdownKeepsInlineCode()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<html><body><p>Run <code>npm install</code> now</p></body></html>""");
            var markdown = result.Children.First().GetEx<string>();
            Assert.Contains("Run `npm install` now", markdown);
        }

        [Fact]
        public void Html2MarkdownKeepsTextOfUnknownElements()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<html><body><table><tr><td>Cell one</td><td>Cell two</td></tr></table><figure><figcaption>A caption</figcaption></figure><p>Hello <u>world</u> again</p></body></html>""");
            var markdown = result.Children.First().GetEx<string>();
            Assert.Contains("Cell one", markdown);
            Assert.Contains("Cell two", markdown);
            Assert.Contains("A caption", markdown);
            Assert.Contains("Hello world again", markdown);
        }

        [Fact]
        public void Html2MarkdownSuppressesScriptAndStyle()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<html><body><p>Content</p><script>var secret = 10;</script><style>.a { color: red; }</style></body></html>""");
            var markdown = result.Children.First().GetEx<string>();
            Assert.Contains("Content", markdown);
            Assert.DoesNotContain("secret", markdown);
            Assert.DoesNotContain("color", markdown);
        }

        [Fact]
        public void Html2MarkdownSuppressesFormMachinery()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<html><body><p>Pick a country</p><select><option>Norway</option><option>Sweden</option></select><button>Submit</button></body></html>""");
            var markdown = result.Children.First().GetEx<string>();
            Assert.Contains("Pick a country", markdown);
            Assert.DoesNotContain("Norway", markdown);
            Assert.DoesNotContain("Submit", markdown);
        }

        [Fact]
        public void RoundTrip()
        {
            var result = Common.Evaluate(@"
.html:@""<html>
  <head>
    <title>Howdy</title>
  </head>
  <body>
    <p class=""""foo"""">Howdy <strong>world</strong> - This is cool!</p>
  </body>
</html>""
html2lambda:x:@.html
lambda2html:x:@html2lambda/*");
            Assert.Equal("<html><head><title>Howdy</title></head><body><p class=\"foo\">Howdy <strong>world</strong> - This is cool!</p></body></html>", result.Children.Skip(2).First().Value);
        }
    }
}
