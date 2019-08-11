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
    // TODO: Implement "Synchronizer" to make sure we synchronize access to the shared Dictionary resource.
    [Slot(Name = "slot")]
    public class Slot : ISlot
    {
        readonly static Dictionary<string, Node> _slots = new Dictionary<string, Node>();

        public static Node GetSlot(string name)
        {
            return _slots[name];
        }

        public void Signal(Node input)
        {
            if (!input.Children.Any((x) => x.Name == ".lambda"))
                throw new ApplicationException("Keyword [slot] requires at least a [.lambda] children node");

            if (input.Children.Any((x => x.Name != ".lambda" && x.Name != ".arguments")))
                throw new ApplicationException("Keyword [slot] can only handle [.lambda] and [.arguments] children nodes");

            var slotNode = new Node(input.Name);
            slotNode.AddRange(input.Children);
            _slots[input.Get<string>()] = slotNode;
        }
    }
}
