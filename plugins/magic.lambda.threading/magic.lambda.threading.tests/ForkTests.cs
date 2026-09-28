/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Threading.Tasks;
using Xunit;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.threading.tests
{
    public class ForkTests
    {
        [Slot(
        Name = "fork-slot-1",
        ReturnsMode = SlotReturnsMode.None)]
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

        [Slot(
        Name = "fork-slot-2",
        ReturnsMode = SlotReturnsMode.None)]
        public class ForkSlot2 : ISlot
        {
            public void Signal(ISignaler signaler, Node input)
            {
                ForkSlot1.SetExecutionCount(ForkSlot1.GetExecutionCount() + 1);
            }
        }

        [Fact]
        public void Join_CarriesWhitelistIntoThread()
        {
            // [join] evaluates each [fork] body on its OWN signaler, with its own empty stack - so
            // unless the whitelist is carried across explicitly, the body runs unrestricted.
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
whitelist
   vocabulary
      join
      fork
   .lambda
      join
         fork
            sleep:1
"));
        }

        [Fact]
        public void Join_WhitelistedSlotInThread_Succeeds()
        {
            var lambda = Common.Evaluate(@"
whitelist
   vocabulary
      join
      fork
      sleep
   .lambda
      join
         fork
            sleep:1
");
            Assert.NotNull(lambda);
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
        public void JoinPreservesForkBodyOutput()
        {
            var lambda = Common.Evaluate(@"
join
   fork
      .src:foo
      get-value:x:@.src
");
            var fork = lambda.Children.First().Children.First();

            Assert.Equal("fork", fork.Name);
            Assert.Equal("foo", fork.Children.Skip(1).First().Value);
        }

        [Fact]
        public void JoinSignatureDocumentsPreservedForkBodyOutput()
        {
            var lambda = Common.Evaluate(@"slot.signature:join");
            var result = lambda.Children.First();
            var fork = result.Children
                .First(x => x.Name == "children")
                .Children
                .First(x => x.Name == "fork");
            var output = result.Children.First(x => x.Name == "output");

            Assert.Equal("Fork body to start and wait for; evaluated body node values and children are preserved in the completed fork node", fork.Children.First(x => x.Name == "description").GetEx<string>());
            Assert.Equal("Resolves to the completed [fork] child nodes with evaluated body node values and children preserved", output.Children.First(x => x.Name == "description").GetEx<string>());
        }

        [Fact]
        public void SemaphoreSignatureDocumentsExecutableLambdaObject()
        {
            var lambda = Common.Evaluate(@"slot.signature:semaphore");
            var result = lambda.Children.First();
            var child = result.Children
                .First(x => x.Name == "children")
                .Children
                .First(x => x.Name == "*");

            Assert.Equal("lambda", child.Children.First(x => x.Name == "type").GetEx<string>());
            Assert.Equal("Executable child lambda object evaluated while the named semaphore is held", child.Children.First(x => x.Name == "description").GetEx<string>());
            Assert.Equal(SlotChildMode.ExecutableLambda.ToString(), child.Children.First(x => x.Name == "mode").GetEx<string>());
            Assert.Equal(SlotChildRole.ExecutableBody.ToString(), child.Children.First(x => x.Name == "role").GetEx<string>());
            Assert.Equal(SlotChildEvaluation.EvalSelf.ToString(), child.Children.First(x => x.Name == "evaluation").GetEx<string>());
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
