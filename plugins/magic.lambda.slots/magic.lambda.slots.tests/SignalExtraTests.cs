/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Linq;
using Xunit;
using magic.node.extensions;

namespace magic.lambda.slots.tests
{
    public class SignalExtraTests
    {
        [Fact]
        public void TrySignalOfMissingSlotReturnsNothing()
        {
            var lambda = Common.Evaluate("try-signal:signal-extra-missing");
            var result = lambda.Children.First();
            Assert.Null(result.Value);
            Assert.Empty(result.Children);
        }

        [Fact]
        public void SignalOfMissingSlotThrows()
        {
            var ex = Assert.Throws<HyperlambdaException>(() => Common.Evaluate("signal:signal-extra-missing"));
            Assert.Contains("does not exist in scope", ex.Message);
        }

        [Fact]
        public void TrySignalOutsideTheWhitelistReturnsNothing()
        {
            var error = Record.Exception(() => Common.Evaluate(@"
slots.create:signal-extra-guarded
   return-value:int:1
whitelist
   vocabulary
      try-signal
   .lambda
      try-signal:signal-extra-guarded"));
            Assert.Null(error);
        }

        [Fact]
        public void SignalOutsideTheWhitelistThrows()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
slots.create:signal-extra-guarded2
   return-value:int:1
whitelist
   vocabulary
      signal
   .lambda
      signal:signal-extra-guarded2"));
        }

        [Fact]
        public void ExecuteUnwrapsNestedArguments()
        {
            var lambda = Common.Evaluate(@"
slots.create:signal-extra-nested
   return-value:x:@.arguments/*/foo/*/inner
.v:hello
execute:signal-extra-nested
   foo
      inner:x:@.v");
            Assert.Equal("hello", lambda.Children.Skip(2).First().Value);
        }

        [Fact]
        public void SignalLeavesArgumentExpressionsToTheSlot()
        {
            var lambda = Common.Evaluate(@"
slots.create:signal-extra-raw
   return-value:x:@.arguments/*/foo
.v:hello
signal:signal-extra-raw
   foo:x:@.v");
            Assert.NotEqual("hello", lambda.Children.Skip(2).First().Value);
        }
    }
}
