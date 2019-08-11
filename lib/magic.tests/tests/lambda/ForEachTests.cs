/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using Xunit;
using magic.node;
using magic.signals.contracts;

namespace magic.tests.tests.lambda
{
    public class ForEachTests
    {
        [Slot(Name = "foo2")]
        public class Foo2Slot : ISlot
        {
            public static int ExecutionCount;

            public void Signal(Node input)
            {
                ++ExecutionCount;
            }
        }

        [Fact]
        public void ForEach_01()
        {
            Common.Evaluate(".foo1\n   bar1\n   bar2\nfor-each:x:../*/.foo1/*\n   foo2");
            Assert.Equal(2, Foo2Slot.ExecutionCount);
        }
    }
}
