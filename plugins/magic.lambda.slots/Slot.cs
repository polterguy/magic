/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using System.Collections.Generic;
using magic.node;
using magic.utils;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.slots
{
    [Slot(Name = "slot")]
    public class Slot : ISlot, IMeta
    {
        readonly ISignaler _signaler;
        readonly static Synchronizer<Dictionary<string, Node>> _slots = new Synchronizer<Dictionary<string, Node>>(new Dictionary<string, Node>());

        public Slot(ISignaler signaler)
        {
            _signaler = signaler ?? throw new ArgumentNullException(nameof(signaler));
        }

        public static Node GetSlot(string name)
        {
            return _slots.Read((slots) => slots[name].Clone());
        }

        public static IEnumerable<string> Slots
        {
            get
            {
                var result = new List<string>();
                _slots.Read(x =>
                {
                    result.AddRange(x.Keys);
                });
                return result;
            }
        }

        public void Signal(Node input)
        {
            if (!input.Children.Any(x => x.Name == ".lambda"))
                throw new ApplicationException("Keyword [slot] requires at least a [.lambda] children node");

            if (input.Children.Any((x => x.Name != ".lambda" && x.Name != ".arguments")))
                throw new ApplicationException("Keyword [slot] can only handle [.lambda] and [.arguments] children nodes");

            var slotNode = new Node();
            slotNode.AddRange(input.Children.Select(x => x.Clone()));
            _slots.Write((slots) => slots[input.GetEx<string>(_signaler)] = slotNode);
        }

        public IEnumerable<Node> GetArguments()
        {
            yield return new Node(":", "*");
            yield return new Node(".lambda", 1);
            yield return new Node(".arguments", 1);
        }
    }
}
