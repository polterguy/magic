/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using magic.node;
using magic.signals.contracts;

namespace magic.lambda
{
    [Slot(Name = "read-line")]
    public class ReadLine : ISlot
    {
        public void Signal(Node input)
        {
            input.Value = Console.ReadLine();
        }
    }
}
