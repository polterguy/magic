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
    [Slot(Name = "vocabulary")]
    public class Vocabulary : ISlot, IMeta
    {
        readonly ISignaler _signaler;

        public Vocabulary(IServiceProvider services)
        {
            _signaler = services.GetService(typeof(ISignaler)) as ISignaler;
        }

        public void Signal(Node input)
        {
            input.Clear();
            input.AddRange(_signaler.Slots.Select((x) => new Node(x)));
        }

        public IEnumerable<Node> GetArguments()
        {
            yield break;
        }
    }
}
