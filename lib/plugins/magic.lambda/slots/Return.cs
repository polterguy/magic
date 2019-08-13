/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System.Collections.Generic;
using magic.node;
using magic.signals.contracts;

namespace magic.lambda.slots
{
    [Slot(Name = "return")]
    public class Return : ISlot, IMeta
    {
        public void Signal(Node input)
        {
            var root = input;
            while (root.Parent != null)
                root = root.Parent;
            root.Value = input.Children;
        }

        public IEnumerable<Node> GetArguments()
        {
            yield return new Node("*", "*");
        }
    }
}
