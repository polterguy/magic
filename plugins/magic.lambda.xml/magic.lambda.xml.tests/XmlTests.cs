/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using Xunit;
using magic.node.extensions;

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
            Assert.Equal("Bloodroot", new Expression("**/xml2lambda/*/*/*/COMMON/*/\\#text").Evaluate(result).First().Value);
            Assert.Equal("qwertyuio", new Expression("**/xml2lambda/*/*/*/COMMON/*/\\@a").Evaluate(result).First().Value);
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
            Assert.Equal("<foo>bar</foo>", new Expression("**/lambda2xml").Evaluate(result).First().Value);
        }
    }
}
