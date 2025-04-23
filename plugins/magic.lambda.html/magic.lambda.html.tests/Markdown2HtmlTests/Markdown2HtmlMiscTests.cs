/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.IO;
using System.Linq;
using Xunit;
using magic.node.extensions;

namespace magic.lambda.html.tests
{
    public class Markdown2HtmlMiscTests
    {
        [Fact]
        public void SingleH1()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<h1>howdy</h1>""");
            Assert.Equal("# howdy", result.Children.First().Value);
        }

        [Fact]
        public void SingleH2()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<h2>howdy</h2>""");
            Assert.Equal("## howdy", result.Children.First().Value);
        }

        [Fact]
        public void SingleH3()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<h3>howdy</h3>""");
            Assert.Equal("### howdy", result.Children.First().Value);
        }

        [Fact]
        public void Single4()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<h4>howdy</h4>""");
            Assert.Equal("#### howdy", result.Children.First().Value);
        }

        [Fact]
        public void SingleH5()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<h5>howdy</h5>""");
            Assert.Equal("##### howdy", result.Children.First().Value);
        }

        [Fact]
        public void SingleH6()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<h6>howdy</h6>""");
            Assert.Equal("###### howdy", result.Children.First().Value);
        }

        [Fact]
        public void SingleParagraph()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<p>howdy""");
            Assert.Equal("howdy", result.Children.First().Value);
        }

        [Fact]
        public void SingleH1WithParagraph()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<h1>howdy</h1><p>bar""");
            Assert.Equal("# howdy\r\n\r\nbar", result.Children.First().Value);
        }

        [Fact]
        public void SingleParagraphWithBold_01()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<p>howdy <strong>world</strong>""");
            Assert.Equal("howdy **world**", result.Children.First().Value);
        }

        [Fact]
        public void SingleParagraphWithBoldContainingCR_LF_01()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<p>howdy <strong>world
JO!</strong>""");
            Assert.Equal("howdy **world JO!**", result.Children.First().Value);
        }

        [Fact]
        public void SingleParagraphWithBoldContainingCR_LF_02()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<p>howdy <strong>world

   

JO!</strong>""");
            Assert.Equal("howdy **world JO!**", result.Children.First().Value);
        }

        [Fact]
        public void SingleParagraphWithBold_02()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<p>howdy <b>world</b>""");
            Assert.Equal("howdy **world**", result.Children.First().Value);
        }

        [Fact]
        public void SingleParagraphWithItalic_01()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<p>howdy <em>world</em>""");
            Assert.Equal("howdy *world*", result.Children.First().Value);
        }

        [Fact]
        public void SingleParagraphWithItalic_02()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<p>howdy <i>world</i>""");
            Assert.Equal("howdy *world*", result.Children.First().Value);
        }

        [Fact]
        public void SingleParagraphWithItalicAndBold_02()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<p>howdy <i>world</i> <strong>hi</strong>""");
            Assert.Equal("howdy *world* **hi**", result.Children.First().Value);
        }

        [Fact]
        public void TwoParagraphs()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<p>howdy1</p><p>howdy2</p>""");
            Assert.Equal("howdy1\r\n\r\nhowdy2", result.Children.First().Value);
        }

        [Fact]
        public void TwoParagraphsOneEmpty()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<p>howdy1</p><p></p>""");
            Assert.Equal("howdy1", result.Children.First().Value);
        }

        [Fact]
        public void ThreeParagraphsOneEmpty()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<p>howdy1</p><p></p><p>world</p>""");
            Assert.Equal("howdy1\r\n\r\nworld", result.Children.First().Value);
        }

        [Fact]
        public void ThreeParagraphsOneEmptyWithEmptySpanAnEm()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<p>howdy1</p><p><span> </span><em>    </em></p><p>world</p>""");
            Assert.Equal("howdy1\r\n\r\nworld", result.Children.First().Value);
        }

        [Fact]
        public void SingleParagraphWithSpan_01()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<p>howdy<span> foo</span></p>""");
            Assert.Equal("howdy foo", result.Children.First().Value);
        }

        [Fact]
        public void SingleParagraphWithSpan_02()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<p>howdy,<span> foo</span></p>""");
            Assert.Equal("howdy, foo", result.Children.First().Value);
        }

        [Fact]
        public void SingleParagraphWithSpan_03()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<p>howdy<span>, foo</span></p>""");
            Assert.Equal("howdy, foo", result.Children.First().Value);
        }

        [Fact]
        public void SingleParagraphWithSpan_04()
        {
            var result = Common.Evaluate(@"
html2markdown:@""  <p>       howdy         <span>    foo    </span>      </p>""");
            Assert.Equal("howdy foo", result.Children.First().Value);
        }

        [Fact]
        public void SingleParagraphWithSpan_05()
        {
            var result = Common.Evaluate(@"
html2markdown:@""  <p>       howdy    ,     <span>    foo    </span>      </p>""");
            Assert.Equal("howdy, foo", result.Children.First().Value);
        }

        [Fact]
        public void SingleParagraphWithSpan_06()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<p>howdy<span>foo</span></p>""");
            Assert.Equal("howdy foo", result.Children.First().Value);
        }

        [Fact]
        public void NestedParagraphs()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<p>howdy<p>foo<p>bar</p></p></p>""");
            Assert.Equal("howdy\r\n\r\nfoo\r\n\r\nbar", result.Children.First().Value);
        }

        [Fact]
        public void SingleDiv()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<div>howdy</div>""");
            Assert.Equal("howdy", result.Children.First().Value);
        }

        [Fact]
        public void SingleDivWithBold()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<div>howdy <strong>world</strong></div>""");
            Assert.Equal("howdy **world**", result.Children.First().Value);
        }

        [Fact]
        public void TwoDivs()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<div>howdy</div><div>world</div>""");
            Assert.Equal("howdy\r\n\r\nworld", result.Children.First().Value);
        }

        [Fact]
        public void SimpleEm()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<em>howdy</p>""");
            Assert.Equal("*howdy*", result.Children.First().Value);
        }

        [Fact]
        public void SimpleStrong()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<strong>howdy</strong>""");
            Assert.Equal("**howdy**", result.Children.First().Value);
        }

        [Fact]
        public void StrongParagraphAndEm()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<strong>howdy</strong><p>para</p><i>foo</i>""");
            Assert.Equal("**howdy**\r\n\r\npara\r\n\r\n*foo*", result.Children.First().Value);
        }

        [Fact]
        public void BlockLevelInsideInline()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<span>howdy <p>world</p></span>""");
            Assert.Equal("howdy\r\n\r\nworld", result.Children.First().Value);
        }

        [Fact]
        public void InlineInsideInline()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<span>howdy <span>world</span></span>""");
            Assert.Equal("howdy world", result.Children.First().Value);
        }

        [Fact]
        public void DivInsideDiv()
        {
            var result = Common.Evaluate(@"
html2markdown:@""<div>howdy <div>world</div></div>""");
            Assert.Equal("howdy world", result.Children.First().Value);
        }

        [Fact]
        public void List_01()
        {
            var result = Common.Evaluate(@"
html2markdown:@""
<ul>
   <li>foo 1</li>
   <li>foo 2</li>
   <li>foo 3</li>
</ul>
""");
            Assert.Equal("* foo 1\r\n* foo 2\r\n* foo 3", result.Children.First().Value);
        }

        [Fact]
        public void ListWithLinks_01()
        {
            var result = Common.Evaluate(@"
html2markdown:@""
<ul>
   <li><a href=""""https://foo1.com"""">foo 1</a></li>
   <li>foo 2</li>
   <li><a href=""""https://foo3.com"""">foo 3</a></li>
</ul>
""");
            Assert.Equal("* [foo 1](https://foo1.com)\r\n* foo 2\r\n* [foo 3](https://foo3.com)", result.Children.First().Value);
        }

        [Fact]
        public void ListWithLinks_02()
        {
            var result = Common.Evaluate(@"
html2markdown:@""
<p>
    <ul>
        <li><a href=""""https://foo1.com"""">foo 1</a></li>
        <li>foo 2</li>
        <li><a href=""""https://foo3.com"""">foo 3</a></li>
    </ul>
</p>
""");
            Assert.Equal("* [foo 1](https://foo1.com)\r\n* foo 2\r\n* [foo 3](https://foo3.com)", result.Children.First().Value);
        }

        [Fact]
        public void TwoListWithLinks_03()
        {
            var result = Common.Evaluate(@"
html2markdown:@""
<p>
    <ul>
        <li><a href=""""https://foo1.com"""">foo 1</a></li>
        <li>foo 2</li>
        <li><a href=""""https://foo3.com"""">foo 3</a></li>
    </ul>
</p>
<ul>
   <li>foo 1</li>
   <li>foo 2</li>
   <li>foo 3</li>
</ul>
""");
            Assert.Equal("* [foo 1](https://foo1.com)\r\n* foo 2\r\n* [foo 3](https://foo3.com)\r\n\r\n* foo 1\r\n* foo 2\r\n* foo 3", result.Children.First().Value);
        }
    }
}
