/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Threading.Tasks;
using Xunit;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.tests
{
    /*
     * Tests for how [eval] records an execution when invoked with a debug recorder on the stack, which is what
     * [system.debug] does. The test slot below stands in for it, since that slot lives in a project requiring a
     * running host.
     */
    public class EvalRecordingTests
    {
        [Slot(Name = "test.record")]
        public class RecordSlot : ISlotAsync
        {
            public async Task SignalAsync(ISignaler signaler, Node input)
            {
                var recording = new Node(".debug.recorder");
                Node error = null;
                try
                {
                    await signaler.ScopeAsync(".debug.recorder", recording, async () =>
                    {
                        await signaler.SignalAsync("eval", input, skipWhitelist: true);
                    });
                }
                catch (Exception err)
                {
                    error = new Node("error", err.Message);
                }
                var steps = recording.Children.ToList();
                var count = recording.Value;
                recording.Clear();
                input.Clear();
                input.Value = count;
                input.AddRange(steps);
                if (error != null)
                    input.Add(error);
            }
        }

        static string Get(Node step, string name) => step.Children.First(x => x.Name == name).Get<object>().ToString();

        [Fact]
        public void Recording_HasOneStepPerStatement_WithSlotAndPath()
        {
            var lambda = Common.Evaluate(@"
.x
test.record
   set-value:x:@.x
      .:a
   set-value:x:@.x
      .:b");
            var steps = lambda.Children.Skip(1).First().Children.ToList();
            Assert.Equal(2, steps.Count);
            Assert.Equal("set-value", Get(steps[0], "slot"));
            Assert.Equal("1.0", Get(steps[0], "path"));
            Assert.Equal("1.1", Get(steps[1], "path"));
        }

        [Fact]
        public void Recording_ContainsHyperlambdaOfWholeProgram_AfterStatement()
        {
            var lambda = Common.Evaluate(@"
.x
test.record
   set-value:x:@.x
      .:a");
            var step = lambda.Children.Skip(1).First().Children.First();
            var hl = Get(step, "lambda");
            Assert.Contains(".x:a", hl.Replace("\r", ""));
            Assert.Contains("test.record", hl);
        }

        [Fact]
        public void Recording_HasElapsedMilliseconds()
        {
            var lambda = Common.Evaluate(@"
test.record
   sleep:1");
            var step = lambda.Children.First().Children.First();
            Assert.IsType<long>(step.Children.First(x => x.Name == "elapsed").Value);
        }

        [Fact]
        public void Recording_IncludesNestedStatements_WithDeeperPath()
        {
            var lambda = Common.Evaluate(@"
.x
test.record
   eval
      set-value:x:@.x
         .:a");
            var steps = lambda.Children.Skip(1).First().Children.ToList();
            Assert.Equal(2, steps.Count);
            Assert.Equal("set-value", Get(steps[0], "slot"));
            Assert.Equal("1.0.0", Get(steps[0], "path"));
            Assert.Equal("eval", Get(steps[1], "slot"));
        }

        [Fact]
        public void Recording_KeepsThrowingStatement_AsLastStep()
        {
            var lambda = Common.Evaluate(@"
test.record
   set-value:x:@.x
      .:a
   throw:oops
   set-value:x:@.y
      .:b");
            var children = lambda.Children.First().Children.ToList();
            Assert.Equal(3, children.Count);
            Assert.Equal("throw", Get(children[1], "slot"));
            Assert.Equal("error", children[2].Name);
        }

        [Fact]
        public void Recording_IsTruncated_AfterMaximumNumberOfSteps()
        {
            var lambda = Common.Evaluate(@"
.i:int:0
test.record
   while
      lt
         get-value:x:@.i
         .:int:8000
      .lambda
         math.increment:x:@.i
         math.increment:x:@.i
         math.increment:x:@.i", maxIterations: false);
            var children = lambda.Children.Skip(1).First().Children.ToList();
            Assert.Equal(10001, children.Count);
            var last = children.Last();
            Assert.Equal(10000, last.Children.First(x => x.Name == "truncated").Value);
        }

        [Fact]
        public void NoRecorder_RecordsNothing()
        {
            var lambda = Common.Evaluate(@"
.x
eval
   set-value:x:@.x
      .:a");
            Assert.Equal("a", lambda.Children.First().Value);
        }
    }
}
