/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using Xunit;
using magic.node.extensions;

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
