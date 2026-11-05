/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.signals.tests.slots
{
    [Slot(
        Name = "foo.bar",
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsDescription = "Resolves to the input text with \"world\" appended")]
    public class FooBar : ISlot
    {
        public void Signal(ISignaler signaler, Node input)
        {
            input.Value = input.Get<string>() + "world";
        }
    }
}
