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
        IServiceProvider _services;

        public Eval(IServiceProvider services)
        {
            _services = services ?? throw new ArgumentNullException(nameof(services));
        }

        public void Signal(Node input)
        {
            var signaler = _services.GetService(typeof(ISignaler)) as ISignaler;
            foreach (var idx in input.Children)
            {
                if (idx.Name.FirstOrDefault() == '.')
                    continue;
                signaler.Signal(idx.Name, idx);
            }
        }
    }
}
