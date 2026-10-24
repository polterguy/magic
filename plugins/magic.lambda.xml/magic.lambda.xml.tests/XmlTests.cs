/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using Xunit;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.xml.tests
{
    public class XmlTests
    {
        [Fact]
        public void FromXml()
        {
            var result = Common.Evaluate(@"
.xml:@""<CATALOG>
  <PLANT>
    <COMMON a=""""qwertyuio"""">Bloodroot</COMMON>
    <BOTANICAL>Sanguinaria canadensis</BOTANICAL>
    <ZONE>4</ZONE>
    <LIGHT>Mostly Shady</LIGHT>
    <PRICE>$2.44</PRICE>
    <AVAILABILITY>031599</AVAILABILITY>
  </PLANT>
</CATALOG>
""
xml2lambda:x:@.xml");
            Assert.Equal("Bloodroot", Expression.Create("**/xml2lambda/*/*/*/COMMON/*/\\#text").Evaluate(result).First().Value);
            Assert.Equal("qwertyuio", Expression.Create("**/xml2lambda/*/*/*/COMMON/*/\\@a").Evaluate(result).First().Value);
        }

        [Fact]
        public void Lambda2XmlSignatureDocumentsExpressionOnly()
        {
            var lambda = Common.Evaluate(@"slot.signature:lambda2xml");
            var result = lambda.Children.First();
            var input = result.Children.First(x => x.Name == "input");

            Assert.True(input.Children.First(x => x.Name == "required").GetEx<bool>());
            Assert.Equal(SlotValueMode.Expression.ToString(), input.Children.First(x => x.Name == "mode").GetEx<string>());
            Assert.DoesNotContain(result.Children, x => x.Name == "children");
        }

        [Fact]
        public void Xml2LambdaSignatureDocumentsAttributeAndTextShape()
        {
            var lambda = Common.Evaluate(@"slot.signature:xml2lambda");
            var result = lambda.Children.First();
            var output = result.Children.First(x => x.Name == "output");

            Assert.Equal(
                "Resolves to the parsed XML hierarchy as child nodes; attributes are emitted as @name child nodes, text as #text child nodes, and comments/whitespace-only text nodes are omitted",
                output.Children.First(x => x.Name == "description").GetEx<string>());
        }

        [Fact]
        public void Roundtrip()
        {
            var result = Common.Evaluate(@"
.xml:@""<CATALOG>
  <PLANT>
    <COMMON a=""""qwertyuio"""">Bloodroot</COMMON>
    <BOTANICAL>Sanguinaria canadensis</BOTANICAL>
    <ZONE>4</ZONE>
    <LIGHT>Mostly Shady</LIGHT>
    <PRICE>$2.44</PRICE>
    <AVAILABILITY>031599</AVAILABILITY>
  </PLANT>
</CATALOG>""
xml2lambda:x:@.xml
lambda2xml:x:@xml2lambda/*
if
   neq:x:@lambda2xml
      get-value:x:@.xml
   .lambda
      throw:Not matching");
            Assert.NotNull(result);
        }

        [Fact]
        public void Throws_01()
        {
            Assert.Throws<HyperlambdaException>(() => {
            Common.Evaluate(@"
.xml:@""<CATALOG></CATALOG>""
xml2lambda:x:@.xml
lambda2xml:x:-
   foo:bar");
            });
        }

        [Fact]
        public void Chldren_01()
        {
            var result = Common.Evaluate(@"
lambda2xml
   foo
      #text:bar");
            Assert.Equal("<foo>bar</foo>", Expression.Create("**/lambda2xml").Evaluate(result).First().Value);
        }
    }
}
