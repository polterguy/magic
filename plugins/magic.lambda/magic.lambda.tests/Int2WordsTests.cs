/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using Xunit;
using magic.node.extensions;

namespace magic.lambda.tests
{
    public class Int2WordsTests
    {
        [Theory]
        [InlineData("0", "zero")]
        [InlineData("7", "seven")]
        [InlineData("13", "thirteen")]
        [InlineData("20", "twenty")]
        [InlineData("57", "fifty-seven")]
        [InlineData("100", "one hundred")]
        [InlineData("557", "five hundred and fifty-seven")]
        [InlineData("1000", "one thousand")]
        [InlineData("1001", "one thousand and one")]
        [InlineData("12345", "twelve thousand three hundred and forty-five")]
        [InlineData("1000000", "one million")]
        [InlineData("2500000", "two million five hundred thousand")]
        [InlineData("3000000000", "three billion")]
        [InlineData("4000000000000", "four trillion")]
        [InlineData("-42", "minus forty-two")]
        public void SpellsOutIntegers(string number, string words)
        {
            var lambda = Common.Evaluate($"int2words:long:{number}");
            Assert.Equal(words, lambda.Children.First().Get<string>());
        }

        [Fact]
        public void SpellsOutLargeNumberUsingAllScales()
        {
            var lambda = Common.Evaluate("int2words:long:1002003004005");
            Assert.Equal(
                "one trillion two billion three million four thousand and five",
                lambda.Children.First().Get<string>());
        }
    }
}
