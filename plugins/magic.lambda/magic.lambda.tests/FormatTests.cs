/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using Xunit;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.tests
{
    public class FormatTests
    {
        [Fact]
        public void Format_01()
        {
            var lambda = Common.Evaluate(@"
.foo:int:57
format:x:-
   pattern:""{0:00000}""");
            Assert.Equal("00057", lambda.Children.Skip(1).First().Value);
            Assert.Empty(lambda.Children.Skip(1).First().Children);
        }

        [Fact]
        public void Format_02()
        {
            var lambda = Common.Evaluate(@"
.foo:decimal:57
format:x:-
   pattern:""{0:0.00}""");
            Assert.Equal("57.00", lambda.Children.Skip(1).First().Value);
            Assert.Empty(lambda.Children.Skip(1).First().Children);
        }

        [Fact]
        public void Format_03()
        {
            var lambda = Common.Evaluate(@"
.foo:decimal:57
format:x:-
   pattern:""{0:0.00}""
   culture:nb-NO");
            Assert.Equal("57,00", lambda.Children.Skip(1).First().Value);
            Assert.Empty(lambda.Children.Skip(1).First().Children);
        }

        [Fact]
        public void FormatSignatureDocumentsFormattableValueKind()
        {
            var lambda = Common.Evaluate(@"slot.signature:format");
            var input = lambda.Children.First().Children.First(x => x.Name == "input");

            Assert.Equal("scalar", input.Children.First(x => x.Name == "kind").GetEx<string>());
            Assert.Equal(SlotValueMode.ValueOrExpression.ToString(), input.Children.First(x => x.Name == "mode").GetEx<string>());
        }
    }
}
