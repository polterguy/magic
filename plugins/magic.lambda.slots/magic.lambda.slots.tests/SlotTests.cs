/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Threading.Tasks;
using Xunit;
using magic.node.extensions;

namespace magic.lambda.slots.tests
{
    public class SlotTests
    {
        [Fact]
        public void CreateSlot()
        {
            var lambda = Common.Evaluate(@"
slots.create:foo
   return-value:int:57
signal:foo");
            Assert.Equal(57, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public async Task CreateSlotAsync()
        {
            var lambda = await Common.EvaluateAsync(@"
slots.create:foo
   return-value:int:57
signal:foo");
            Assert.Equal(57, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void CreateSlotDelete_Throws()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
slots.create:foo
   return-value:int:57
slots.delete:foo
signal:foo"));
        }

        [Fact]
        public void CreateSlotCheckIfExists()
        {
            var lambda = Common.Evaluate(@"
slots.create:foo
   return-value:int:57
slots.exists:foo");
            Assert.Equal(true, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void CreateSlotVocabulary()
        {
            var lambda = Common.Evaluate(@"
slots.create:foo
   return-value:int:57
slots.vocabulary");
            Assert.NotEmpty(lambda.Children.Skip(1).First().Children);
            Assert.NotEmpty(lambda.Children.Skip(1).First().Children.Where(x => x.GetEx<string>() == "foo"));
        }

        [Fact]
        public void CreateSlotVocabularySorted_01()
        {
            var lambda = Common.Evaluate(@"
slots.create:fooBB
   return-value:int:57
slots.create:fooAA
   return-value:int:57
slots.vocabulary");
            Assert.NotEmpty(lambda.Children.Skip(1).First().Children);
            Assert.NotEmpty(lambda.Children.Skip(2).First().Children.Where(x => x.GetEx<string>() == "fooAA"));
            Assert.NotEmpty(lambda.Children.Skip(2).First().Children.Where(x => x.GetEx<string>() == "fooBB"));
            Assert.Single(lambda.Children.Skip(2).First().Children.Where(x => x.Get<string>() == "fooAA"));
            Assert.Single(lambda.Children.Skip(2).First().Children.Where(x => x.Get<string>() == "fooBB"));
        }

        [Fact]
        public void CreateSlotVocabularySorted_02()
        {
            var lambda = Common.Evaluate(@"
slots.create:fooBB
   return-value:int:57
slots.create:fooAA
   return-value:int:57
slots.vocabulary:foo");
            Assert.NotEmpty(lambda.Children.Skip(1).First().Children);
            Assert.NotEmpty(lambda.Children.Skip(2).First().Children.Where(x => x.GetEx<string>() == "fooAA"));
            Assert.NotEmpty(lambda.Children.Skip(2).First().Children.Where(x => x.GetEx<string>() == "fooBB"));
            Assert.Single(lambda.Children.Skip(2).First().Children.Where(x => x.Get<string>() == "fooAA"));
            Assert.Single(lambda.Children.Skip(2).First().Children.Where(x => x.Get<string>() == "fooBB"));
        }

        [Fact]
        public void CreateSlotVocabularyWithFilter()
        {
            var lambda = Common.Evaluate(@"
slots.create:foo
   return-value:int:57
slots.vocabulary:not-foo");
            Assert.Empty(lambda.Children.Skip(1).First().Children);
        }

        [Fact]
        public void CreateSlotVocabularyWhitelist()
        {
            var lambda = Common.Evaluate(@"
.result
slots.create:fxoo1
   return-value:int:42
slots.create:fxoo2
   return-value:int:57
add:x:@.result
   whitelist
      vocabulary
         return-nodes
         slots.vocabulary
         signal:fxoo1
      .lambda
         slots.vocabulary
         return-nodes:x:-/*
");
            Assert.Single(lambda.Children.First().Children);
            Assert.Equal("fxoo1", lambda.Children.First().Children.First().Value);
        }

        [Fact]
        public async Task CreateSlotVocabularyWhitelist_Async()
        {
            var lambda = await Common.EvaluateAsync(@"
.result
slots.create:fxoo1
   return-value:int:42
slots.create:fxoo2
   return-value:int:57
add:x:@.result
   whitelist
      vocabulary
         return-nodes
         slots.vocabulary
         signal:fxoo1
      .lambda
         slots.vocabulary
         return-nodes:x:-/*
");
            Assert.Single(lambda.Children.First().Children);
            Assert.Equal("fxoo1", lambda.Children.First().Children.First().Value);
        }

        [Fact]
        public void CreateSlotVocabularyWhitelist_Throws()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
.result
slots.create:fxoo1
   return-value:int:42
slots.create:fxoo2
   return-value:int:57
whitelist
   vocabulary
      set-value
      signal:fxoo1
   .lambda
      set-value:x:@.result
         signal:fxoo2"));
        }

        [Fact]
        public async Task CreateSlotVocabularyWhitelist_Async_Throws()
        {
            await Assert.ThrowsAsync<HyperlambdaException>(async () => await Common.EvaluateAsync(@"
.result
slots.create:fxoo1
   return-value:int:42
slots.create:fxoo2
   return-value:int:57
whitelist
   vocabulary
      set-value
      signal:fxoo1
   .lambda
      set-value:x:@.result
         signal:fxoo2"));
        }

        [Fact]
        public void CreateSlotVocabularyWhitelist_Succeeds()
        {
            var lambda = Common.Evaluate(@"
.result
slots.create:fxoo1
   return-value:int:42
slots.create:fxoo2
   return-value:int:57
set-value:x:@.result
   whitelist
      vocabulary
         return
         signal:fxoo1
      .lambda
         signal:fxoo1
         return:x:-
");
            Assert.Equal(42, lambda.Children.First().Value);
        }

        [Fact]
        public async Task CreateSlotVocabularyWhitelist_Async_Succeeds()
        {
            var lambda = await Common.EvaluateAsync(@"
.result
slots.create:fxoo1
   return-value:int:42
slots.create:fxoo2
   return-value:int:57
set-value:x:@.result
   whitelist
      vocabulary
         set-value
         signal:fxoo1
         return
      .lambda
         set-value:x:+
            signal:fxoo1
         return
");
            Assert.Equal(42, lambda.Children.First().Value);
        }

        [Fact]
        public void CreateAndRetrieveSlot()
        {
            var lambda = Common.Evaluate(@"
slots.create:foo
   .foo:bar
slots.get:foo");
            Assert.Single(lambda.Children.Skip(1).First().Children);
            Assert.Equal(".foo", lambda.Children.Skip(1).First().Children.First().Name);
            Assert.Equal("bar", lambda.Children.Skip(1).First().Children.First().Value);
        }

        [Fact]
        public void OverwriteSlot()
        {
            var lambda = Common.Evaluate(@"
slots.create:foo
   return-value:int:57
slots.create:foo
   return-value:int:42
signal:foo");
            Assert.Equal(42, lambda.Children.Skip(2).First().Value);
        }

        [Fact]
        public void ArgumentPassing()
        {
            var lambda = Common.Evaluate(@"
slots.create:foo
   return-value:x:@.arguments/*
signal:foo
   foo:int:57");
            Assert.Equal(57, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public async Task ArgumentPassingAsync()
        {
            var lambda = await Common.EvaluateAsync(@"
slots.create:foo
   return-value:x:@.arguments/*
signal:foo
   foo:int:57");
            Assert.Equal(57, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void ReturnValue()
        {
            var lambda = Common.Evaluate(@"
slots.create:foo
   return:foo
signal:foo");
            Assert.Equal("foo", lambda.Children.Skip(1).First().GetEx<string>());
        }

        [Fact]
        public void ReturnValueExpression()
        {
            var lambda = Common.Evaluate(@"
slots.create:foo
   .foo:foo
   return:x:-
signal:foo");
            Assert.Equal("foo", lambda.Children.Skip(1).First().GetEx<string>());
        }

        [Fact]
        public void ReturnNodes()
        {
            var lambda = Common.Evaluate(@"
slots.create:foo
   return-nodes
      foo1:bar1
      foo2:bar2
signal:foo");
            Assert.Equal(2, lambda.Children.Skip(1).First().Children.Count());
            Assert.Equal("foo1", lambda.Children.Skip(1).First().Children.First().Name);
            Assert.Equal("foo2", lambda.Children.Skip(1).First().Children.Skip(1).First().Name);
            Assert.Equal("bar1", lambda.Children.Skip(1).First().Children.First().Value);
            Assert.Equal("bar2", lambda.Children.Skip(1).First().Children.Skip(1).First().Value);
        }

        [Fact]
        public void ReturnNodesImplicitly()
        {
            var lambda = Common.Evaluate(@"
slots.create:foo
   return
      foo1:bar1
      foo2:bar2
signal:foo");
            Assert.Equal(2, lambda.Children.Skip(1).First().Children.Count());
            Assert.Equal("foo1", lambda.Children.Skip(1).First().Children.First().Name);
            Assert.Equal("foo2", lambda.Children.Skip(1).First().Children.Skip(1).First().Name);
            Assert.Equal("bar1", lambda.Children.Skip(1).First().Children.First().Value);
            Assert.Equal("bar2", lambda.Children.Skip(1).First().Children.Skip(1).First().Value);
        }

        [Fact]
        public void ReturnNodesAndValueImplicitly()
        {
            var lambda = Common.Evaluate(@"
slots.create:foo
   return:foo
      foo1:bar1
      foo2:bar2
signal:foo");
            Assert.Equal(2, lambda.Children.Skip(1).First().Children.Count());
            Assert.Equal("foo", lambda.Children.Skip(1).First().GetEx<string>());
            Assert.Equal("foo1", lambda.Children.Skip(1).First().Children.First().Name);
            Assert.Equal("foo2", lambda.Children.Skip(1).First().Children.Skip(1).First().Name);
            Assert.Equal("bar1", lambda.Children.Skip(1).First().Children.First().Value);
            Assert.Equal("bar2", lambda.Children.Skip(1).First().Children.Skip(1).First().Value);
        }

        [Fact]
        public void ReturnNodesImpicitlyExpression()
        {
            var lambda = Common.Evaluate(@"
slots.create:foox3
   .foo
      foo1:bar1
      foo2:bar2
   return:x:-/*
signal:foox3");
            Assert.Equal(2, lambda.Children.Skip(1).First().Children.Count());
            Assert.Equal("foo1", lambda.Children.Skip(1).First().Children.First().Name);
            Assert.Equal("foo2", lambda.Children.Skip(1).First().Children.Skip(1).First().Name);
            Assert.Equal("bar1", lambda.Children.Skip(1).First().Children.First().Value);
            Assert.Equal("bar2", lambda.Children.Skip(1).First().Children.Skip(1).First().Value);
        }

        [Fact]
        public void ReturnNodesFromExpression()
        {
            var lambda = Common.Evaluate(@"
slots.create:foo
   .result
      foo1:bar1
      foo2:bar2
   return-nodes:x:-/*
signal:foo");
            Assert.Equal(2, lambda.Children.Skip(1).First().Children.Count());
            Assert.Equal("foo1", lambda.Children.Skip(1).First().Children.First().Name);
            Assert.Equal("foo2", lambda.Children.Skip(1).First().Children.Skip(1).First().Name);
            Assert.Equal("bar1", lambda.Children.Skip(1).First().Children.First().Value);
            Assert.Equal("bar2", lambda.Children.Skip(1).First().Children.Skip(1).First().Value);
        }

        [Fact]
        public void ReturnNodesFromExpressionInvokedMultipleTimes()
        {
            var lambda = Common.Evaluate(@"
slots.create:foo
   .result
      foo1:bar1
      foo2:bar2
   return-nodes:x:-/*
signal:foo
signal:foo");
            Assert.Equal(2, lambda.Children.Skip(1).First().Children.Count());
            Assert.Equal("foo1", lambda.Children.Skip(1).First().Children.First().Name);
            Assert.Equal("foo2", lambda.Children.Skip(1).First().Children.Skip(1).First().Name);
            Assert.Equal("bar1", lambda.Children.Skip(1).First().Children.First().Value);
            Assert.Equal("bar2", lambda.Children.Skip(1).First().Children.Skip(1).First().Value);
            Assert.Equal(2, lambda.Children.Skip(2).First().Children.Count());
            Assert.Equal("foo1", lambda.Children.Skip(2).First().Children.First().Name);
            Assert.Equal("foo2", lambda.Children.Skip(2).First().Children.Skip(1).First().Name);
            Assert.Equal("bar1", lambda.Children.Skip(2).First().Children.First().Value);
            Assert.Equal("bar2", lambda.Children.Skip(2).First().Children.Skip(1).First().Value);
        }
    }
}
