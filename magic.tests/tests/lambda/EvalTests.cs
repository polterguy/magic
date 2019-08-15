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
    public class EvalTests
    {
        [Slot(Name = "foo")]
        public class FooSlot : ISlot
        {
            public void Signal(Node input)
            {
                input.Value = "OK";
            }
        }

        [Slot(Name = "foo_double")]
        public class FooDoubleSlot1 : ISlot
        {
            public void Signal(Node input)
            {
                input.Value = input.Get<int>() + 1;
            }
        }

        [Slot(Name = "foo_double")]
        public class FooDoubleSlot2 : ISlot
        {
            public void Signal(Node input)
            {
                input.Value = input.Get<int>() + 1;
            }
        }

        [Fact]
        public void InvokeCustomSignal()
        {
            var lambda = Common.Evaluate(@"foo");
            Assert.Equal("OK", lambda.Children.First().Value);
        }

        [Fact]
        public void InvokeCustomSignalDoubleHandled()
        {
            var lambda = Common.Evaluate(@"foo_double:int:0");
            Assert.Equal(2, lambda.Children.First().Value);
        }

        [Fact]
        public void InvokeNonExistingSignal_Throws()
        {
            Assert.Throws<ApplicationException>(() => Common.Evaluate(@"foo_XXX"));
        }
    }
}
