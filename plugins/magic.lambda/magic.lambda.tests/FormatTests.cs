/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using Xunit;

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
    }
}
