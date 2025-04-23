/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Threading.Tasks;
using Xunit;
using magic.node.extensions;

namespace magic.lambda.tests
{
    public class WhileTests
    {
        [Fact]
        public void While_01()
        {
            var lambda = Common.Evaluate(@"
.src
   bar1
   bar2
.dest
while
   mt
      get-count:x:../*/.src/*
      .:int:0
   .lambda
      add:x:../*/.dest
         get-nodes:x:../*/.src/0
      remove-nodes:x:../*/.src/0");
            Assert.Equal(2, lambda.Children.Skip(1).First().Children.Count());
        }

        [Fact]
        public void WhileExpression_01()
        {
            var lambda = Common.Evaluate(@"
.src
   bar1
   bar2
.dest
.continue:bool:true
while:x:@.continue
   add:x:../*/.dest
      get-nodes:x:../*/.src/0
   remove-nodes:x:../*/.src/0
   if
      eq
         get-count:x:@.src/*
         .:int:0
      .lambda
         set-value:x:@.continue
            .:bool:false");
            Assert.Equal(2, lambda.Children.Skip(1).First().Children.Count());
            Assert.False(lambda.Children.Skip(2).First().Get<bool>());
            Assert.False(lambda.Children.Skip(3).First().Get<bool>());
        }

        [Fact]
        public async Task WhileExpressionAsync_01()
        {
            var lambda = await Common.EvaluateAsync(@"
.src
   bar1
   bar2
.dest
.continue:bool:true
while:x:@.continue
   add:x:../*/.dest
      get-nodes:x:../*/.src/0
   remove-nodes:x:../*/.src/0
   if
      eq
         get-count:x:@.src/*
         .:int:0
      .lambda
         set-value:x:@.continue
            .:bool:false");
            Assert.Equal(2, lambda.Children.Skip(1).First().Children.Count());
            Assert.False(lambda.Children.Skip(2).First().Get<bool>());
            Assert.False(lambda.Children.Skip(3).First().Get<bool>());
        }

        [Fact]
        public void While_02()
        {
            var lambda = Common.Evaluate(@".src
while
   .:bool:false
   .lambda
      set-value:x:@.src
         .:FAILURE");
            Assert.NotEqual("FAILURE", lambda.Children.First().Name);
        }

        [Fact]
        public async Task WhileAync()
        {
            var lambda = await Common.EvaluateAsync(@".src
   bar1
   bar2
.dest
while
   mt
      get-count:x:../*/.src/*
      .:int:0
   .lambda
      add:x:../*/.dest
         get-nodes:x:../*/.src/0
      remove-nodes:x:../*/.src/0");
            Assert.Equal(2, lambda.Children.Skip(1).First().Children.Count());
        }

        [Fact]
        public void WhileTerminate()
        {
            var lambda = Common.Evaluate(@".src
   bar1
   bar2
.dest
while
   mt
      get-count:x:../*/.src/*
      .:int:0
   .lambda
      add:x:../*/.dest
         get-nodes:x:../*/.src/0
      remove-nodes:x:../*/.src/0
      return:done");
            Assert.Single(lambda.Children.Skip(1).First().Children);
        }

        [Fact]
        public void WhileTerminateNodes()
        {
            var lambda = Common.Evaluate(@".src
   bar1
   bar2
.dest
while
   mt
      get-count:x:../*/.src/*
      .:int:0
   .lambda
      add:x:../*/.dest
         get-nodes:x:../*/.src/0
      remove-nodes:x:../*/.src/0
      return
         result:done");
            Assert.Single(lambda.Children.Skip(1).First().Children);
        }

        [Fact]
        public void WhileThrows()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
.src
   bar1
   bar2
.dest
while
   mt
      get-count:x:../*/.src/*
      .:int:0
   .lambdaXX
      add:x:../*/.dest
         get-nodes:x:../*/.src/0
      remove-nodes:x:../*/.src/0
      return
         result:done"));
        }

        [Fact]
        public async Task WhileThrowsAsync()
        {
            await Assert.ThrowsAsync<HyperlambdaException>(async () => await Common.EvaluateAsync(@"
.src
   bar1
   bar2
.dest
while
   mt
      get-count:x:../*/.src/*
      .:int:0
   .lambdaXX
      add:x:../*/.dest
         get-nodes:x:../*/.src/0
      remove-nodes:x:../*/.src/0
      return
         result:done"));
        }

        [Fact]
        public async Task WhileTerminateAsync()
        {
            var lambda = await Common.EvaluateAsync(@".src
   bar1
   bar2
.dest
while
   mt
      get-count:x:../*/.src/*
      .:int:0
   .lambda
      add:x:../*/.dest
         get-nodes:x:../*/.src/0
      remove-nodes:x:../*/.src/0
      return:done");
            Assert.Single(lambda.Children.Skip(1).First().Children);
        }

        [Fact]
        public void While_InfiniteLoop()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
while
   .:bool:true
   .lambda"));
        }

        [Fact]
        public async Task While_InfiniteLoopAsync()
        {
            await Assert.ThrowsAsync<HyperlambdaException>(async () => await Common.EvaluateAsync(@"
while
   .:bool:true
   .lambda"));
        }

        [Fact]
        public void WhileNoLambdaThrows()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
while
   .:bool:true"));
        }

        [Fact]
        public async Task WhileNoLambdaAsyncThrows()
        {
            await Assert.ThrowsAsync<HyperlambdaException>(async () => await Common.EvaluateAsync(@"
while
   .:bool:true"));
        }

        [Fact]
        public void While_InfiniteLoopStopsTooLate_01()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
.no:int:0
while
   lt
      get-value:x:@.no
      .:int:70
   .lambda
      math.increment:x:@.no"));
        }

        [Fact]
        public void While_InfiniteLoopStopsTooLate_02()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
.no:int:0
while
   lt
      get-value:x:@.no
      .:int:5001
   .lambda
      math.increment:x:@.no", false));
        }
    }
}
