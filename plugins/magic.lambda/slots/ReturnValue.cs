/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using System.Collections.Generic;
using magic.node;
using magic.signals.contracts;

namespace magic.lambda.slots
{
    [Slot(Name = "return-value")]
    public class ReturnValue : ISlot, IMeta
    {
        public void Signal(Node input)
        {
            if (input.Children.Any())
                throw new ApplicationException("Slot [return-value] cannot have children nodes");

            var root = input;

            // Notice, we store the return value as the value (by reference) of the root node of whatever lambda object we're currently within.
            while (root.Parent != null)
                root = root.Parent;
            root.Value = input.Get();
        }

        public IEnumerable<Node> GetArguments()
        {
            yield return new Node("*", "*");
        }
    }
}
