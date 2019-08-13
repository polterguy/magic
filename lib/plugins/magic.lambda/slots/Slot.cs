/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using System.Collections.Generic;
using magic.node;
using magic.lambda.utilities;
using magic.signals.contracts;

namespace magic.lambda.slots
{
    [Slot(Name = "slot")]
    public class Slot : ISlot, IMeta
    {
        readonly static Synchronizer<Dictionary<string, Node>> _slots = new Synchronizer<Dictionary<string, Node>>(new Dictionary<string, Node>());

        public static Node GetSlot(string name)
        {
            return _slots.Read((slots) => slots[name].Clone());
        }

        public void Signal(Node input)
        {
            if (!input.Children.Any((x) => x.Name == ".lambda"))
                throw new ApplicationException("Keyword [slot] requires at least a [.lambda] children node");

            if (input.Children.Any((x => x.Name != ".lambda" && x.Name != ".arguments")))
                throw new ApplicationException("Keyword [slot] can only handle [.lambda] and [.arguments] children nodes");

            var slotNode = new Node(input.Name);
            slotNode.AddRange(input.Children);
            _slots.Write((slots) => slots[input.Get<string>()] = slotNode);
        }

        public IEnumerable<Node> GetArguments()
        {
            yield return new Node(":", "string");
            yield return new Node(".lambda", 1);
            yield return new Node(".arguments", 0);
        }
    }
}
