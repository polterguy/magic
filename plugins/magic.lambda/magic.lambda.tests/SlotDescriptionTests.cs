/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using Xunit;
using System.Linq;
using magic.node.extensions;

namespace magic.lambda.tests
{
    public class SlotDescriptionTests
    {
        [Fact]
        public void ReturnsDescriptionForSingleSlot()
        {
            var lambda = Common.Evaluate(@"slot.description:while");
            Assert.Equal("Repeats execution while a condition is true", lambda.Children.First().GetEx<string>());
        }

        [Fact]
        public void ReturnsDescriptionForCorrectAlias()
        {
            var lambda = Common.Evaluate(@"slot.description:execute");
            Assert.Equal("Invokes a dynamic slot after unwrapping descendant expressions", lambda.Children.First().GetEx<string>());
        }

        [Fact]
        public void ThrowsForUnknownSlot()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"slot.description:some.unknown.slot"));
        }
    }
}
