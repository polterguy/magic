/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Linq;
using Xunit;
using magic.node;
using magic.node.extensions;

namespace magic.lambda.xml.tests
{
    public class XmlExtraTests
    {
        static Node Xml2Lambda(string xml)
        {
            var node = new Node("xml2lambda", xml);
            Common.GetSignaler().Signal("xml2lambda", node);
            return node;
        }

        [Fact]
        public void CDataSectionsKeepTheirContent()
        {
            var node = Xml2Lambda("<root><![CDATA[a < b && c]]></root>");
            var cdata = node.Children.First().Children.First();
            Assert.Equal("#cdata-section", cdata.Name);
            Assert.Equal("a < b && c", cdata.Value);
        }

        [Fact]
        public void AttributesBecomeAtNodes()
        {
            var node = Xml2Lambda("<root id=\"7\" name=\"a &amp; b\"><child/></root>");
            var root = node.Children.First();
            Assert.Equal("7", root.Children.First(x => x.Name == "@id").Value);
            Assert.Equal("a & b", root.Children.First(x => x.Name == "@name").Value);
        }

        [Fact]
        public void TextNodesAreHtmlDecoded()
        {
            var node = Xml2Lambda("<root>fish &amp; chips</root>");
            Assert.Equal("fish & chips", node.Children.First().Children.First().Value);
        }

        [Fact]
        public void ExcessiveNestingIsRejected()
        {
            var xml = string.Concat(Enumerable.Repeat("<a>", 300)) + string.Concat(Enumerable.Repeat("</a>", 300));
            var ex = Assert.Throws<HyperlambdaException>(() => Xml2Lambda(xml));
            Assert.Contains("nested too deeply", ex.Message);
        }

        [Fact]
        public void Lambda2XmlOfNothingThrows()
        {
            // There is no root to turn into a document, which currently surfaces as an InvalidOperationException.
            Assert.Throws<System.InvalidOperationException>(() => Common.GetSignaler().Signal("lambda2xml", new Node("lambda2xml")));
        }
    }
}
