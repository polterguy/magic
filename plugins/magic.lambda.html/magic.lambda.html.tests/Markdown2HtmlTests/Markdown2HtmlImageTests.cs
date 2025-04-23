/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.IO;
using System.Linq;
using Xunit;
using magic.node.extensions;

namespace magic.lambda.html.tests
{
    public class Markdown2HtmlImageTests
    {
        [Fact]
        public void ImgNoBase_01()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<img alt=""""howdy"""" src=""""/foo.png"""">""");
            Assert.Equal("![howdy](/foo.png)", result.Children.First().Value);
        }

        [Fact]
        public void ImgNoBase_02()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<img src=""""foo.png"""">""");
            Assert.Equal("![Image](foo.png)", result.Children.First().Value);
        }

        [Fact]
        public void ImgWithUrl_01()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<img alt=""""howdy"""" src=""""/foo.png"""">""
   url:""https://howdy.com""");
            Assert.Equal("![howdy](https://howdy.com/foo.png)", result.Children.First().Value);
        }

        [Fact]
        public void ImgWithUrl_02()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<img alt=""""howdy"""" src=""""foo.png"""">""
   url:""https://howdy.com/""");
            Assert.Equal("![howdy](https://howdy.com/foo.png)", result.Children.First().Value);
        }

        [Fact]
        public void ImgWithUrl_03()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<img alt=""""howdy"""" src=""""foo.png"""">""
   url:""https://howdy.com""");
            Assert.Equal("![howdy](https://howdy.com/foo.png)", result.Children.First().Value);
        }

        [Fact]
        public void ImgWithUrl_04()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<img alt=""""howdy"""" src=""""../../foo.png"""">""
   url:""https://howdy.com/foo1/foo2/foo3""");
            Assert.Equal("![howdy](https://howdy.com/foo.png)", result.Children.First().Value);
        }

        [Fact]
        public void ImgWithUrl_05()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<img alt=""""howdy"""" src=""""../../foo.png"""">""
   url:""https://howdy.com/foo1/foo2/foo3/""");
            Assert.Equal("![howdy](https://howdy.com/foo1/foo.png)", result.Children.First().Value);
        }

        [Fact]
        public void ImgWithUrl_06()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<img alt=""""howdy"""" src=""""../../bar1/foo.png"""">""
   url:""https://howdy.com/foo1/foo2/foo3/""");
            Assert.Equal("![howdy](https://howdy.com/foo1/bar1/foo.png)", result.Children.First().Value);
        }

        [Fact]
        public void ImgWithBase_01()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<html>
  <head>
    <title>Foo</title>
    <base href=""""https://gokk.com"""">
  </head>
  <body>
    <img alt=""""howdy"""" src=""""/foo.png"""">
  </body>
</html>""");
            Assert.Equal("![howdy](https://gokk.com/foo.png)", result.Children.First().Value);
        }

        [Fact]
        public void ImgWithBase_02()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<html>
  <head>
    <title>Foo</title>
    <base href=""""https://gokk.com/"""">
  </head>
  <body>
    <img alt=""""howdy"""" src=""""foo.png"""">
  </body>
</html>""");
            Assert.Equal("![howdy](https://gokk.com/foo.png)", result.Children.First().Value);
        }

        [Fact]
        public void ImgWithBase_03()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<html>
  <head>
    <title>Foo</title>
    <base href=""""https://gokk.com"""">
  </head>
  <body>
    <img alt=""""howdy"""" src=""""foo.png"""">
  </body>
</html>""");
            Assert.Equal("![howdy](https://gokk.com/foo.png)", result.Children.First().Value);
        }

        [Fact]
        public void ImgWithBaseAndUrl()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<html>
  <head>
    <title>Foo</title>
    <base href=""""https://gokk.com"""">
  </head>
  <body>
    <img alt=""""howdy"""" src=""""foo.png"""">
  </body>
</html>""
   url:""https://error.com""");
            Assert.Equal("![howdy](https://gokk.com/foo.png)", result.Children.First().Value);
        }
    }
}
