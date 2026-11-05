/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Linq;
using Xunit;
using magic.node.extensions;

namespace magic.lambda.slots.tests
{
    public class ReturnNodesExtraTests
    {
        [Fact]
        public void YieldUnwrapsNestedExpressionsBeforeReturning()
        {
            var lambda = Common.Evaluate(@"
slots.create:rn-yield-nested
   .src:val
   yield
      foo
         inner:x:@.src
signal:rn-yield-nested");
            var foo = lambda.Children.Skip(1).First().Children.First();
            Assert.Equal("foo", foo.Name);
            Assert.Equal("val", foo.Children.First().Value);
        }

        [Fact]
        public void GetOfMissingSlotThrows()
        {
            var ex = Assert.Throws<HyperlambdaException>(() => Common.Evaluate("slots.get:rn-never-created"));
            Assert.Contains("non-existing slot", ex.Message);
        }
    }
}
