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
    [Slot(Name = "never-whitelisted", Whitelistable = false)]
    public class NeverWhitelistedSlot : ISlot
    {
        public void Signal(ISignaler signaler, Node input)
        {
            input.Value = "OK";
        }
    }

    public class WhitelistableTests
    {
        [Fact]
        public void WhitelistRefusesSlotThatCanNeverBeWhitelisted()
        {
            var exception = Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
whitelist
   vocabulary
      never-whitelisted
   .lambda
      never-whitelisted"));
            Assert.Equal("[never-whitelisted] can never be used inside a [whitelist]", exception.Message);
        }

        [Fact]
        public void WhitelistRefusesItEvenAmongAllowedSlots()
        {
            var exception = Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
whitelist
   vocabulary
      get-value
      never-whitelisted
      return
   .lambda
      return:foo"));
            Assert.Equal("[never-whitelisted] can never be used inside a [whitelist]", exception.Message);
        }

        [Fact]
        public void SlotRunsOutsideWhitelist()
        {
            var lambda = Common.Evaluate("never-whitelisted");
            Assert.Equal("OK", lambda.Children.First().Value);
        }

        [Fact]
        public void WhitelistStillAcceptsOrdinarySlots()
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
