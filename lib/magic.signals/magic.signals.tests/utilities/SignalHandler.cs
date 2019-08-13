/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System.Linq;
using magic.node;
using magic.signals.contracts;

namespace magic.signals.tests.utilities
{
    [Slot(Name = "foo.bar")]
    public class SignalHandler : ISlot
    {
        public void Signal(Node input)
        {
            input.Children.First().Value = input.Children.First().Get<string>() + "Yup!";
        }
    }
}
