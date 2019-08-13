/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
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
            var voc = lambda.Children.First().Children.First(x => x.Name == "vocabulary");
            Assert.NotNull(voc);
            Assert.Null(voc.Value);
        }

        [Fact]
        public void Meta()
        {
            var signaler = Common.GetSignaler();
            var args = signaler.GetArguments("case");
            Assert.Equal(2, args.Count());
            Assert.Contains(args, (x) => x.Name == "*" && x.Get<string>() == "*");
            Assert.Contains(args, (x) => x.Name == ":" && x.Get<string>() == "*");
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
      return
         foo:bar");
            var lambda = Common.Evaluate("signal:custom.slot_6");
            Assert.Single(lambda.Children.First().Children);
            Assert.Equal("foo", lambda.Children.First().Children.First().Name);
            Assert.Equal("bar", lambda.Children.First().Children.First().Value);
        }
    }
}
