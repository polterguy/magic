/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Threading.Tasks;
using Xunit;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.threading.tests
{
    public class ForkTests
    {
        [Slot(Name = "fork-slot-1")]
        public class ForkSlot1 : ISlot
        {
            static int ExecutionCount;

            public static void SetExecutionCount(int value) { ExecutionCount = value; }

            public static int GetExecutionCount() => ExecutionCount;

            public void Signal(ISignaler signaler, Node input)
            {
                Assert.Equal(0, ExecutionCount);
            }
        }

        [Slot(Name = "fork-slot-2")]
        public class ForkSlot2 : ISlot
        {
            public void Signal(ISignaler signaler, Node input)
            {
                ForkSlot1.SetExecutionCount(ForkSlot1.GetExecutionCount() + 1);
            }
        }

        [Fact]
        public void ForkWithSleep()
        {
            ForkSlot1.SetExecutionCount(0);
            var lambda = Common.Evaluate(@"
fork
   fork-slot-1
sleep:100
fork-slot-2
");
            Assert.Equal(1, ForkSlot1.GetExecutionCount());
        }

        [Fact]
        public void ForkWithJoin()
        {
            ForkSlot1.SetExecutionCount(0);
            var lambda = Common.Evaluate(@"
join
   fork
      sleep:100
      fork-slot-2
   fork
      sleep:100
      fork-slot-2
");
            Assert.Equal(2, ForkSlot1.GetExecutionCount());
        }

        [Fact]
        public async Task ForkWithJoinAsync()
        {
            ForkSlot1.SetExecutionCount(0);
            var lambda = await Common.EvaluateAsync(@"
join
   fork
      sleep:100
      fork-slot-2
   fork
      sleep:100
      fork-slot-2
");
            Assert.Equal(2, ForkSlot1.GetExecutionCount());
        }

        [Fact]
        public void Semaphore_Throws()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
semaphore
"));
        }

        [Fact]
        public async Task ForkWithSleepAsync()
        {
            ForkSlot1.SetExecutionCount(0);
            var lambda = await Common.EvaluateAsync(@"
fork
   fork-slot-1
sleep:100
fork-slot-2
");
            Assert.Equal(1, ForkSlot1.GetExecutionCount());
        }
    }
}
