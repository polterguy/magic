/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Threading.Tasks;
using Xunit;
using magic.node;
using magic.signals.contracts;

namespace magic.lambda.tests
{
    public class ForEachTests
    {
        [Slot(Name = "foo2")]
        public class Foo2Slot : ISlot
        {
            static int ExecutionCount;
            public static int GetExecutionCount() => ExecutionCount;
            public static void SetExecutionCount(int value) { ExecutionCount = value; }

            public void Signal(ISignaler signaler, Node input)
            {
                ++ExecutionCount;
            }
        }

        [Fact]
        public void ForEach_01()
        {
            Foo2Slot.SetExecutionCount(0);
            Common.Evaluate(@".foo1
   bar1
   bar2
   bar3
for-each:x:../*/.foo1/*
   foo2");
            Assert.Equal(3, Foo2Slot.GetExecutionCount());
        }

        [Fact]
        public void ForEach_02()
        {
            Foo2Slot.SetExecutionCount(0);
            Common.Evaluate(@".foo1
   bar1
   bar2
   bar3
for-each:x:../*/.foo1/*
   foo2
   return:done");
            Assert.Equal(1, Foo2Slot.GetExecutionCount());
        }

        [Fact]
        public void ForEach_03()
        {
            Foo2Slot.SetExecutionCount(0);
            Common.Evaluate(@".foo1
   bar1
   bar2
   bar3
for-each:x:../*/.foo1/*
   foo2
   return
      result:done");
            Assert.Equal(1, Foo2Slot.GetExecutionCount());
        }

        [Fact]
        public async Task ForEachAsync_01()
        {
            Foo2Slot.SetExecutionCount(0);
            await Common.EvaluateAsync(@".foo1
   bar1
   bar2
   bar3
for-each:x:../*/.foo1/*
   foo2");
            Assert.Equal(3, Foo2Slot.GetExecutionCount());
        }

        [Fact]
        public async Task ForEachAsync_02()
        {
            Foo2Slot.SetExecutionCount(0);
            await Common.EvaluateAsync(@".foo1
   bar1
   bar2
   bar3
for-each:x:../*/.foo1/*
   foo2
   return:done");
            Assert.Equal(1, Foo2Slot.GetExecutionCount());
        }

        [Fact]
        public async Task ForEachAsync_03()
        {
            Foo2Slot.SetExecutionCount(0);
            await Common.EvaluateAsync(@".foo1
   bar1
   bar2
   bar3
for-each:x:../*/.foo1/*
   foo2
   return
      result:done");
            Assert.Equal(1, Foo2Slot.GetExecutionCount());
        }
    }
}
