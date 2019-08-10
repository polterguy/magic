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
    [Slot(Name = "eval")]
    public class Eval : ISlot
    {
        readonly ISignaler _signaler;

        public Eval(IServiceProvider services)
        {
            _signaler = services.GetService(typeof(ISignaler)) as ISignaler;
        }

        public void Signal(Node input)
        {
            foreach (var idx in input.Children)
            {
                if (idx.Name.FirstOrDefault() == '.')
                    continue;
                _signaler.Signal(idx.Name, idx);
            }
        }
    }
}
