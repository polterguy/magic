/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.IO;
using System.Linq;
using Xunit;
using magic.node.extensions;

namespace magic.lambda.html.tests
{
    public class Markdown2HtmlMetaTests
    {
        [Fact]
        public void MetaInfo_01()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<html>
  <head>
    <title>Title of document</title>
  </head>
  <body>
  </body>
</html>""");
            Assert.Equal("Title of document", result.Children.First().Children.First(x => x.Name == "title").Value);
            Assert.Single(result.Children.First().Children);
        }

        [Fact]
        public void MetaInfo_02()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<html>
  <head>
    <title>Title of document</title>
    <meta name=""""description"""" content=""""This is the description. Hello there, vader!"""">
  </head>
  <body>
  </body>
</html>""");
            Assert.Equal(2, result.Children.First().Children.Count());
            Assert.Equal("Title of document", result.Children.First().Children.First(x => x.Name == "title").Value);
            Assert.Equal("This is the description. Hello there, vader!", result.Children.First().Children.First(x => x.Name == "description").Value);
        }

        [Fact]
        public void MetaInfo_03()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<html>
  <head>
    <title>Title of document</title>
  </head>
  <body>
  </body>
</html>""
   url:""https://foo.com""");
            Assert.Equal("Title of document", result.Children.First().Children.First(x => x.Name == "title").Value);
            Assert.Equal("https://foo.com", result.Children.First().Children.First(x => x.Name == "url").Value);
            Assert.Equal(2, result.Children.First().Children.Count());
        }

        [Fact]
        public void MetaInfo_04()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<html>
  <head>
    <title>Title of document</title>
    <meta property=""""og:foo"""" content=""""This is the description. Hello there, vader!"""">
  </head>
  <body>
  </body>
</html>""");
            Assert.Equal(2, result.Children.First().Children.Count());
            Assert.Equal("Title of document", result.Children.First().Children.First(x => x.Name == "title").Value);
            Assert.Equal("This is the description. Hello there, vader!", result.Children.First().Children.First(x => x.Name == "og:foo").Value);
        }
    }
}
