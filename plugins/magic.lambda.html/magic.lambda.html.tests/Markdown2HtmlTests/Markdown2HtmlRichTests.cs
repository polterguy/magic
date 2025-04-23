/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.IO;
using System.Linq;
using Xunit;
using magic.node.extensions;

namespace magic.lambda.html.tests
{
    public class Markdown2HtmlRichTests
    {
        [Fact]
        public void RichHtml_01()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<html>
  <head>
    <title>Foo</title>
  </head>
  <body>
    <img alt=""""howdy"""" src=""""foo.png"""">
    <p>foo</p>
    <p>bar</p>
    <span>howdy</span>
  </body>
</html>""");
            Assert.Equal("![howdy](foo.png)\r\n\r\nfoo\r\n\r\nbar\r\n\r\nhowdy", result.Children.First().Value);
        }

        [Fact]
        public void RichHtml_02()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<html>
  <head>
    <title>Foo</title>
  </head>
  <body>
    <p>foo</p>
    <img alt=""""howdy"""" src=""""foo.png"""">
    <p>bar</p>
    <span>howdy</span>
  </body>
</html>""");
            Assert.Equal("foo\r\n\r\n![howdy](foo.png)\r\n\r\nbar\r\n\r\nhowdy", result.Children.First().Value);
        }

        [Fact]
        public void RichHtml_03()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<html>
  <head>
    <title>Foo</title>
  </head>
  <body>
    <p>foo</p>
    <img alt=""""howdy"""" src=""""foo.png"""">
    <p>bar</p>
    <a href=""""https://google.com"""">jo!</a>
    <span>howdy</span>
  </body>
</html>""");
            Assert.Equal("foo\r\n\r\n![howdy](foo.png)\r\n\r\nbar\r\n\r\n[jo!](https://google.com) howdy", result.Children.First().Value);
        }

        [Fact]
        public void RichHtml_04()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<html>
  <head>
    <title>Foo</title>
  </head>
  <body>
    <div>
        <h1>header</h1>
        <p>foo</p>
        <img alt=""""howdy"""" src=""""foo.png"""">
        <p>bar</p>
        <a href=""""https://google.com"""">jo!</a>
        <span>howdy</span>
    </div>
  </body>
</html>""");
            Assert.Equal("# header\r\n\r\nfoo\r\n\r\n![howdy](foo.png)\r\n\r\nbar\r\n\r\n[jo!](https://google.com) howdy", result.Children.First().Value);
        }

        [Fact]
        public void RichHtml_05()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<html>
  <head>
    <title>Foo</title>
  </head>
  <body>
    <div>
        howdy
        <div>world</div>
        <h1>header</h1>
        <p>foo</p>
        <img alt=""""howdy"""" src=""""foo.png"""">
        <p>bar</p>
        <p>
            <a href=""""https://google.com"""">jo!</a>
        </p>
        <p>
            <img src=""""https://image.com"""" alt=""""image foo"""">
        </p>
        <span>howdy</span>
        <a href=""""/buy"""">
            Buy Now
        </a>
    </div>
    <div>
        <img src=""""/foo.webp"""" alt=""""ROI"""" />
    </div>
    <div>
        <div>foo</div>
    </div>
    <div>
       <span>bar</span>
    </div>
  </body>
</html>""");
            Assert.Equal("howdy world\r\n\r\n# header\r\n\r\nfoo\r\n\r\n![howdy](foo.png)\r\n\r\nbar\r\n\r\n[jo!](https://google.com)\r\n\r\n![image foo](https://image.com)\r\n\r\nhowdy\r\n\r\n[Buy Now](/buy)\r\n\r\n![ROI](/foo.webp)\r\n\r\nfoo\r\n\r\nbar", result.Children.First().Value);
        }

        [Fact]
        public void RichHtml_06()
        {
            var result = Common.Evaluate(@"
html2markdown:@""

<html>
  <head>
    <title>Foo</title>
  </head>
  <body>
<!-- ChatGPT Chatbot -->
  <div class=""""relative pt-20 about-area"""">
    <div class=""""container px-4"""">
      <div class=""""flex flex-wrap"""">
        <div class=""""w-full lg:w-1/2"""">
          <div class=""""mx-4 mt-12 about-content max-w-[450px] wow fadeInLeftBig"""" data-wow-duration=""""1s""""
            data-wow-delay=""""0.5s"""">
            <div class=""""mb-4 section-title"""">
              <div class=""""
                    w-40
                    h-1
                    mb-3
                    bg-gradient-to-r
                    to-[#fe8464]
                    from-[#fe6e9a]
                  """"></div>
              <h3 class=""""text-[32px] pt-2 font-bold"""">
                Relieve Stress<br><span class=""""font-normal""""> Be Available 24/7</span>
              </h3>
            </div>
            <!-- section title -->
            <p class=""""mb-8"""">
              Our unique technology allows you to create a
              custom AI chatbot and embed it on your own website.
              Use it to help your customers, or increase your sales.
            </p>
            <a href=""""/chatgpt-website-chatbot"""" class=""""main-btn gradient-btn"""">Read more about AI Chatbots</a>
          </div>
          <!-- about content -->
        </div>
        <div class=""""w-full lg:w-1/2"""">
          <div class=""""mx-4 mt-12 text-center about-image wow fadeInRightBig"""" data-wow-duration=""""1s""""
            data-wow-delay=""""0.5s"""">
            <img
              src=""""/assets/images/relieve-stress.png""""
              loading=""""lazy""""
              alt=""""Relieve stress by outsourcing jobs to the AI"""" />
          </div>
          <!-- about image -->
        </div>
      </div>
      <!-- row -->
    </div>
    <!-- container -->
    <div class=""""about-shape-1 absolute top-0 right-0 h-full z-[-1] w-[35%]"""">
      <img
        src=""""/assets/images/about/about-shape-1.svg""""
        alt=""""shape"""" />
    </div>
  </div>
  <!-- /ChatGPT Chatbot -->
  </body>
</html>""
   url:""https://ainiro.io""");
            Assert.Equal("### Relieve Stress Be Available 24/7\r\n\r\nOur unique technology allows you to create a custom AI chatbot and embed it on your own website. Use it to help your customers, or increase your sales.\r\n\r\n[Read more about AI Chatbots](https://ainiro.io/chatgpt-website-chatbot)\r\n\r\n![Relieve stress by outsourcing jobs to the AI](https://ainiro.io/assets/images/relieve-stress.png)\r\n\r\n![shape](https://ainiro.io/assets/images/about/about-shape-1.svg)", result.Children.First().Value);
        }

        [Fact]
        public void RichHtml_07()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<html>
  <head>
    <title>Foo</title>
  </head>
  <body>
    <pre>

foo
bar</pre>
   <code>howdy</code>
  </body>
</html>""");
            Assert.Equal("```\r\nfoo\r\nbar\r\n```\r\n\r\n`howdy`", result.Children.First().Value);
        }

        [Fact]
        public void RichHtml_08()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<html>
  <head>
    <title>Foo</title>
  </head>
  <body>
    <div>
      <div>
        <img src=""""/foo.png"""" alt=""""foo"""">
      </div>
    </div>
  </body>
</html>""");
            Assert.Equal("![foo](/foo.png)", result.Children.First().Value);
        }

        [Fact]
        public void RichHtml_09()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<html>
  <head>
    <title>Foo</title>
  </head>
  <body>
    <section>
      <picture>
        <span>
          <div>
            <img src=""""/foo.png"""" alt=""""foo"""">
          </div>
        </span>
      </picture>
    </section>
  </body>
</html>""");
            Assert.Equal("![foo](/foo.png)", result.Children.First().Value);
        }
    }
}
