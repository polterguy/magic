/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Linq;
using Xunit;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.tests
{
    [Slot(Name = "pinned-only", PinRequired = true)]
    public class PinnedOnlySlot : ISlot
    {
        public void Signal(ISignaler signaler, Node input)
        {
            input.Value = "OK";
        }
    }

    public class PinRequiredTests
    {
        [Theory]
        [InlineData("")]
        [InlineData(":")]
        [InlineData(":*")]
        [InlineData(":**")]
        [InlineData(":\" * \"")]
        public void WhitelistRefusesSlotThatMustBePinnedWithoutAPin(string pin)
        {
            var exception = Assert.Throws<HyperlambdaException>(() => Common.Evaluate($@"
whitelist
   vocabulary
      return
      pinned-only{pin}
   .lambda
      return:foo"));
            Assert.Equal("[pinned-only] must be pinned to a value inside a [whitelist]", exception.Message);
        }

        [Fact]
        public void WhitelistAcceptsSlotThatMustBePinnedWithAPin()
        {
            var lambda = Common.Evaluate(@"
whitelist
   vocabulary
      pinned-only:foo
      return-value
   .lambda
      pinned-only:foo
      return-value:x:@pinned-only");
            Assert.Equal("OK", lambda.Children.First().Value);
        }

        [Fact]
        public void PinnedSlotIsStillRefusedForAnotherArgument()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
whitelist
   vocabulary
      pinned-only:foo
   .lambda
      pinned-only:bar"));
        }

        [Fact]
        public void SlotThatMustBePinnedRunsOutsideWhitelist()
        {
            var lambda = Common.Evaluate("pinned-only");
            Assert.Equal("OK", lambda.Children.First().Value);
        }

        [Fact]
        public void SlotNotDeclaringItNeedsNoPin()
        {
            var lambda = Common.Evaluate(@"
whitelist
   vocabulary
      return
   .lambda
      return:foo");
            Assert.Equal("foo", lambda.Children.First().Value);
        }
    }
}
