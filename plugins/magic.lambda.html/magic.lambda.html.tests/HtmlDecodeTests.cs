/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using Xunit;
using magic.node.extensions;

namespace magic.lambda.html.tests
{
    public class HtmlDecodeTests
    {
        [Fact]
        public void DecodesEntities()
        {
            var lambda = Common.Evaluate("html-decode:@\"&lt;p&gt;fish &amp; chips&lt;/p&gt;\"");
            Assert.Equal("<p>fish & chips</p>", lambda.Children.First().Get<string>());
        }
    }
}
