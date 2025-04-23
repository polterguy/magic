/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using magic.node;
using magic.signals.contracts;

namespace magic.signals.tests.slots
{
    [Slot(Name = "stack.test")]
    public class StackTest : ISlot
    {
        public void Signal(ISignaler signaler, Node input)
        {
            input.Value = signaler.Peek<string>("value");
        }
    }

    [Slot(Name = "stack.test.dispose")]
    public class StackTestDispose : ISlot
    {
        public void Signal(ISignaler signaler, Node input)
        {
            input.Value = signaler.Peek<object>("value.dispose").ToString();
        }
    }
}
