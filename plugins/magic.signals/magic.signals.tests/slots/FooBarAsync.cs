/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Threading.Tasks;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.signals.tests.slots
{
    [Slot(
        Name = "foo.bar.async",
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsDescription = "Resolves to the input text with \"world\" appended")]
    public class FooBarAsync : ISlotAsync
    {
        public Task SignalAsync(ISignaler signaler, Node input)
        {
            return Task.Run(() => input.Value = input.Get<string>() + "world");
        }
    }
}
