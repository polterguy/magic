/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using Xunit;
using magic.node;
using magic.signals.contracts;

namespace magic.tests.lambda
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

        [Slot(Name = "foo4")]
        public class Foo4Slot : ISlot
        {
            public static int ExecutionCount;

            public void Signal(Node input)
            {
                ++ExecutionCount;
            }
        }

        [Fact]
        public void Vocabulary()
        {
            var lambda = Common.Evaluate("vocabulary");
            Assert.True(lambda.Children.First().Children.Count() > 20);
            var voc = lambda.Children.First().Children.First(x => x.Get<string>() == "vocabulary");
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

        [Fact]
        public void PassInArgs()
        {
            Common.Evaluate(@"slot:custom.slot_5
   .arguments
      foo4
   .lambda
      eval:x:../*/.arguments");
            Assert.Equal(0, Foo4Slot.ExecutionCount);
            Common.Evaluate(@"signal:custom.slot_5
   foo4");
            Assert.Equal(1, Foo4Slot.ExecutionCount);
        }

        [Fact]
        public void ReturnNodeFromSlot()
        {
            Common.Evaluate(@"slot:custom.slot_6
   .lambda
      return-nodes
         foo:bar");
            var lambda = Common.Evaluate("signal:custom.slot_6");
            Assert.Single(lambda.Children.First().Children);
            Assert.Equal("foo", lambda.Children.First().Children.First().Name);
            Assert.Equal("bar", lambda.Children.First().Children.First().Value);
        }

        [Fact]
        public void PassInWrongArgs_Throws()
        {
            Common.Evaluate(@"slot:custom.slot_7
   .arguments
      foo4
   .lambda
      eval:x:../*/.arguments");
            Assert.Throws<ApplicationException>(() =>
            {
                Common.Evaluate(@"signal:custom.slot_7
   foo4_XX");
            });
        }

        [Fact]
        public void ReturnValueFromSlot()
        {
            Common.Evaluate(@"slot:custom.slot_8
   .lambda
      return-value:foo
      throw:foo");
            var lambda = Common.Evaluate("signal:custom.slot_8");
            Assert.Equal("foo", lambda.Children.First().Value);
        }

        [Fact]
        public void AcceptAllArgumentsSlot()
        {
            Common.Evaluate(@"slot:custom.slot_9
   .arguments
      *
   .lambda
      return-value:foo");
            var lambda = Common.Evaluate(@"signal:custom.slot_9
   not-declared:bar");
            Assert.Equal("foo", lambda.Children.First().Value);
        }
    }
}
