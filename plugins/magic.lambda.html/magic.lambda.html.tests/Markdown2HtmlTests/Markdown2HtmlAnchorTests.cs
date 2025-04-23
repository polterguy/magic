/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.IO;
using System.Linq;
using Xunit;
using magic.node.extensions;

namespace magic.lambda.html.tests
{
    public class Markdown2HtmlAnchorTests
    {
        [Fact]
        public void AnchorNoScheme_01()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<a href=""""//bar.com/foo"""">foo</a>""
   url:""https://error.com""");
            Assert.Equal("[foo](https://bar.com/foo)", result.Children.First().Value);
            Assert.Equal(2, result.Children.First().Children.Count());
            Assert.Single(result.Children.First().Children.First(x => x.Name == "urls").Children);
            Assert.Equal("https://bar.com/foo", result.Children.First().Children.First(x => x.Name == "urls").Children.First().Value);
        }

        [Fact]
        public void AnchorNoScheme_02()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<a href=""""//bar.com/foo"""">foo</a>""
   url:""http://error.com""");
            Assert.Equal("[foo](http://bar.com/foo)", result.Children.First().Value);
            Assert.Equal(2, result.Children.First().Children.Count());
            Assert.Single(result.Children.First().Children.First(x => x.Name == "urls").Children);
            Assert.Equal("http://bar.com/foo", result.Children.First().Children.First(x => x.Name == "urls").Children.First().Value);
        }

        [Fact]
        public void AnchorNoSchemeAndNoUrlAndNoBase()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<a href=""""//bar.com/foo"""">foo</a>""");
            Assert.Equal("[foo](https://bar.com/foo)", result.Children.First().Value);
        }

        [Fact]
        public void AnchorSlashNoBaseAndNoUrl()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<a href=""""/foo"""">foo</a>""");
            Assert.Equal("[foo](/foo)", result.Children.First().Value);
            Assert.Single(result.Children.First().Children);
            Assert.Single(result.Children.First().Children.First(x => x.Name == "urls").Children);
            Assert.Equal("/foo", result.Children.First().Children.First(x => x.Name == "urls").Children.First().Value);
        }

        [Fact]
        public void AnchorSlashAndUrl()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<a href=""""/howdy"""">foo bar</a>""
   url:""https://foo.com/bar/""");
            Assert.Equal("[foo bar](https://foo.com/howdy)", result.Children.First().Value);
            Assert.Equal(2, result.Children.First().Children.Count());
            Assert.Single(result.Children.First().Children.First(x => x.Name == "urls").Children);
            Assert.Equal("https://foo.com/howdy", result.Children.First().Children.First(x => x.Name == "urls").Children.First().Value);
        }

        [Fact]
        public void AnchorSlashAndBaseWithoutSlash_01()
        {
            var result = Common.Evaluate(@"
html2markdown:@""
<html>
    <head>
        <title>foo</title>
        <base href=""""https://foo.com"""">
    </head>
    <body>
        <a href=""""/howdy"""">foo bar</a>
    </body>
</html>
""");
            Assert.Equal("[foo bar](https://foo.com/howdy)", result.Children.First().Value);
            Assert.Equal(2, result.Children.First().Children.Count());
            Assert.Single(result.Children.First().Children.First(x => x.Name == "urls").Children);
            Assert.Equal("https://foo.com/howdy", result.Children.First().Children.First(x => x.Name == "urls").Children.First().Value);
        }

        [Fact]
        public void AnchorSlashAndBaseWithoutSlash_02()
        {
            var result = Common.Evaluate(@"
html2markdown:@""
<html>
    <head>
        <title>foo</title>
        <base href=""""https://foo.com"""">
    </head>
    <body>
        <a href=""""/howdy1"""">foo bar 1</a>
        <a href=""""/howdy2"""">foo bar 2</a>
    </body>
</html>
""");
            Assert.Equal("[foo bar 1](https://foo.com/howdy1) [foo bar 2](https://foo.com/howdy2)", result.Children.First().Value);
            Assert.Equal(2, result.Children.First().Children.Count());
            Assert.Equal(2, result.Children.First().Children.First(x => x.Name == "urls").Children.Count());
            Assert.Equal("https://foo.com/howdy1", result.Children.First().Children.First(x => x.Name == "urls").Children.First().Value);
            Assert.Equal("https://foo.com/howdy2", result.Children.First().Children.First(x => x.Name == "urls").Children.Skip(1).First().Value);
        }

        [Fact]
        public void AnchorSlashAndBaseWithoutSlash_03()
        {
            var result = Common.Evaluate(@"
html2markdown:@""
<html>
    <head>
        <title>foo</title>
        <base href=""""https://foo.com"""">
    </head>
    <body>
        <p>
            <a href=""""/howdy1"""">foo bar 1</a>
        </p>
        <p>
            <a href=""""/howdy2"""">foo bar 2</a>
        </p>
    </body>
</html>
""");
            Assert.Equal("[foo bar 1](https://foo.com/howdy1)\r\n\r\n[foo bar 2](https://foo.com/howdy2)", result.Children.First().Value);
            Assert.Equal(2, result.Children.First().Children.Count());
            Assert.Equal(2, result.Children.First().Children.First(x => x.Name == "urls").Children.Count());
            Assert.Equal("https://foo.com/howdy1", result.Children.First().Children.First(x => x.Name == "urls").Children.First().Value);
            Assert.Equal("https://foo.com/howdy2", result.Children.First().Children.First(x => x.Name == "urls").Children.Skip(1).First().Value);
        }

        [Fact]
        public void AnchorSlashAndBaseWithSlash()
        {
            var result = Common.Evaluate(@"
html2markdown:@""
<html>
    <head>
        <title>foo</title>
        <base href=""""https://foo.com/"""">
    </head>
    <body>
        <a href=""""/howdy"""">foo bar</a>
    </body>
</html>
""");
            Assert.Equal("[foo bar](https://foo.com/howdy)", result.Children.First().Value);
        }

        [Fact]
        public void AnchorWithSlashAndBaseAndUrl_01()
        {
            var result = Common.Evaluate(@"
html2markdown:@""
<html>
    <head>
        <title>foo</title>
        <base href=""""https://foo.com"""">
    </head>
    <body>
        <a href=""""howdy2"""">foo bar</a>
    </body>
</html>
""
   url:""https://error.com/howdy1""");
            Assert.Equal("[foo bar](https://foo.com/howdy2)", result.Children.First().Value);
        }

        [Fact]
        public void AnchorWithSlashAndBaseAndUrl_02()
        {
            var result = Common.Evaluate(@"
html2markdown:@""
<html>
    <head>
        <title>foo</title>
        <base href=""""https://foo.com/howdy1/"""">
    </head>
    <body>
        <a href=""""howdy2"""">foo bar</a>
    </body>
</html>
""
   url:""https://error.com/""");
            Assert.Equal("[foo bar](https://foo.com/howdy1/howdy2)", result.Children.First().Value);
        }

        [Fact]
        public void AnchorWithoutSlashAndWithUrlBeingDocumentUrl()
        {
            var result = Common.Evaluate(@"
html2markdown:@""
<html>
    <head>
        <title>foo</title>
    </head>
    <body>
        <a href=""""howdy2"""">foo bar</a>
    </body>
</html>
""
   url:""https://foo.com/error.html""");
            Assert.Equal("[foo bar](https://foo.com/howdy2)", result.Children.First().Value);
        }

        [Fact]
        public void AnchorWithoutSlashAndWithUrlBeingDocumentUrlDeep()
        {
            var result = Common.Evaluate(@"
html2markdown:@""
<html>
    <head>
        <title>foo</title>
    </head>
    <body>
        <a href=""""howdy2"""">foo bar</a>
    </body>
</html>
""
   url:""https://foo.com/foo/error1.html""");
            Assert.Equal("[foo bar](https://foo.com/foo/howdy2)", result.Children.First().Value);
        }

        [Fact]
        public void AnchorWithImage_01()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<a href=""""/foo""""><img src=""""https://image.com"""" alt=""""Some image""""></a>""");
            Assert.Equal("[![Some image](https://image.com)](/foo)", result.Children.First().Value);
        }

        [Fact]
        public void AnchorWithImage_02()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<a href=""""/"""">
   <img src=""""https://image.com"""" alt=""""Some image"""">
</a>""");
            Assert.Equal("[![Some image](https://image.com)](/)", result.Children.First().Value);
        }

        [Fact]
        public void AnchorWithImage_03()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<a href=""""/"""">
   <img src=""""https://image.com"""" alt=""""Some image"""">
   foo
</a>""");
            Assert.Equal("[![Some image](https://image.com)](/)", result.Children.First().Value);
        }

        [Fact]
        public void AnchorWithImage_04()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<a href=""""/"""">
   foo
   <img src=""""https://image.com"""" alt=""""Some image"""">
</a>""");
            Assert.Equal("[foo](/)", result.Children.First().Value);
        }

        [Fact]
        public void AnchorWithImage_05()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<a href=""""/"""">
   foo
   <img src=""""https://image.com"""" alt=""""Some image"""">
   bar
</a>""");
            Assert.Equal("[foo bar](/)", result.Children.First().Value);
        }

        [Fact]
        public void AnchorWithImageAndText_01()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<a href=""""/foo""""><img src=""""https://image.com"""" alt=""""Some image"""">foo</a>""");
            Assert.Equal("[![Some image](https://image.com)](/foo)", result.Children.First().Value);
        }

        [Fact]
        public void AnchorWithImageAndText_02()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<a href=""""/foo"""">foo<img src=""""https://image.com"""" alt=""""Some image""""></a>""");
            Assert.Equal("[foo](/foo)", result.Children.First().Value);
        }

        [Fact]
        public void AnchorWithH1_01()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<a href=""""/foo"""">foo <h1>bar</h1></a>""");
            Assert.Equal("[foo bar](/foo)", result.Children.First().Value);
        }

        [Fact]
        public void AnchorWithH1_02()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<a href=""""/foo"""">foo<h1>bar</h1></a>""");
            Assert.Equal("[foo bar](/foo)", result.Children.First().Value);
        }

        [Fact]
        public void AnchorWithH1_03()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<a href=""""/foo""""><h1>foo</h1>bar</a>""");
            Assert.Equal("[foo bar](/foo)", result.Children.First().Value);
        }

        [Fact]
        public void AnchorInsideListNoScheme()
        {
            var result = Common.Evaluate(@"
html2markdown:@""
<ul>
  <li>
    <a href=""""//bar.com/foo"""">foo</a>
  </li>
</ul>
""
   url:""http://error.com""");
            Assert.Equal("* [foo](http://bar.com/foo)", result.Children.First().Value);
        }
    }
}
