/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using System.Collections.Generic;
using magic.node;
using magic.signals.contracts;

namespace magic.lambda.change
{
    [Slot(Name = "remove-node")]
    public class RemoveNode : ISlot, IMeta
    {
        readonly ISignaler _signaler;

        public RemoveNode(IServiceProvider services)
        {
            _signaler = services.GetService(typeof(ISignaler)) as ISignaler;
        }

        public void Signal(Node input)
        {
            foreach (var idx in input.Evaluate().ToList())
            {
                idx.Parent.Remove(idx);
            }
        }

        public IEnumerable<Node> GetArguments()
        {
            yield return new Node(":", "x");
            yield return new Node("*", 1);
        }
    }
}
