/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System.Linq;
using System.Collections.Generic;
using magic.node;
using magic.signals.contracts;

namespace magic.lambda.slots
{
    [Slot(Name = "return-nodes")]
    public class ReturnNodes : ISlot
    {
        public void Signal(Node input)
        {
            var root = input;

            // Notice, we store the return value as the value (by reference) of the root node of whatever lambda object we're currently within.
            while (root.Parent != null)
                root = root.Parent;
            if (input.Value == null)
                root.Value = input.Children;
            else
                root.Value = input.Evaluate().ToList();
        }
    }
}
