/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Collections.Concurrent;
using Xunit;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.tests
{
    public class SortTests
    {
        [Slot(
        Name = "sort-test.thread",
        ReturnsMode = SlotReturnsMode.None)]
        public class ThreadSlot : ISlot
        {
            public static readonly ConcurrentDictionary<string, ConcurrentBag<int>> Threads = new();

            public void Signal(ISignaler signaler, Node input)
            {
                Threads.GetOrAdd(input.Get<string>(), _ => new ConcurrentBag<int>()).Add(Environment.CurrentManagedThreadId);
            }
        }

        [Fact]
        public void SortAscending()
        {
            var lambda = Common.Evaluate(@"
.list
   .:int:3
   .:int:1
   .:int:2
sort:x:@.list/*
   set-value:x:@.result
      .:int:0
   if
      lt:x:@.lhs/#
         get-value:x:@.rhs/#
      .lambda
         set-value:x:@.result
            .:int:-1
   else-if
      mt:x:@.lhs/#
         get-value:x:@.rhs/#
      .lambda
         set-value:x:@.result
            .:int:1
");
            Assert.Equal(new object[] { 1, 2, 3 }, lambda.Children.Skip(1).First().Children.Select(x => x.Value).ToArray());
        }

        [Fact]
        public void SortLargeList_ComparerRunsOnTheThreadThatSorts()
        {
            ThreadSlot.Threads.Clear();
            var items = string.Join("\n", Enumerable.Range(0, 300).Select(x => $"   .:int:{(x * 7919) % 300}"));
            var lambda = Common.Evaluate($@"
.list
{items}
sort-test.thread:outside
sort:x:@.list/*
   sort-test.thread:inside
   set-value:x:@.result
      .:int:0
   if
      lt:x:@.lhs/#
         get-value:x:@.rhs/#
      .lambda
         set-value:x:@.result
            .:int:-1
   else-if
      mt:x:@.lhs/#
         get-value:x:@.rhs/#
      .lambda
         set-value:x:@.result
            .:int:1
");
            var sorted = lambda.Children.Skip(2).First().Children.Select(x => Convert.ToInt32(x.Value)).ToList();
            Assert.Equal(300, sorted.Count);
            Assert.Equal(sorted.OrderBy(x => x).ToList(), sorted);

            // The comparer is evaluated once per comparison, and must never be handed to another thread.
            var outside = ThreadSlot.Threads["outside"].Single();
            var inside = ThreadSlot.Threads["inside"];
            Assert.True(inside.Count > 300);
            Assert.All(inside, x => Assert.Equal(outside, x));
        }
    }
}
