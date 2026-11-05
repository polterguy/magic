/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using magic.node;
using magic.signals.contracts;

namespace magic.signals.tests.slots
{
    [Slot(
        Name = "stack.test",
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsDescription = "Resolves to the stored stack value")]
    public class StackTest : ISlot
    {
        public void Signal(ISignaler signaler, Node input)
        {
            input.Value = signaler.Peek<string>("value");
        }
    }

    [Slot(
        Name = "stack.test.dispose",
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsDescription = "Resolves to the stored disposable stack value converted to a string")]
    public class StackTestDispose : ISlot
    {
        public void Signal(ISignaler signaler, Node input)
        {
            input.Value = signaler.Peek<object>("value.dispose").ToString();
        }
    }
}
