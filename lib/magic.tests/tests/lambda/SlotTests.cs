/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using Xunit;
using magic.node;
using magic.signals.contracts;

namespace magic.tests.tests.lambda
{
    public class SlotTests
    {
        [Slot(Name = "foo3")]
        public class Foo3Slot : ISlot
        {
            public static int ExecutionCount;

            public void Signal(Node input)
            {
                ++ExecutionCount;
            }
        }

        [Fact]
        public void CreateSlot()
        {
            Common.Evaluate(@"slot:custom.slot_1
   .lambda");
        }

        [Fact]
        public void CreateSlotNoLambda_Throws()
        {
            Assert.Throws<ApplicationException>(() => Common.Evaluate("slot:custom.slot_2"));
        }

        [Fact]
        public void CreateSlotUnknownArgument_Throws()
        {
            Assert.Throws<ApplicationException>(() => Common.Evaluate(@"slot:custom.slot_3
   .howdy-world"));
        }

        [Fact]
        public void CreateAndExecuteSlot()
        {
            Common.Evaluate(@"slot:custom.slot_4
   .lambda
      foo3");
            Assert.Equal(0, Foo3Slot.ExecutionCount);
            Common.Evaluate("signal:custom.slot_4");
            Assert.Equal(1, Foo3Slot.ExecutionCount);
            Common.Evaluate("signal:custom.slot_4");
            Assert.Equal(2, Foo3Slot.ExecutionCount);
        }
    }
}
