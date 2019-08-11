/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using magic.node;
using magic.signals.contracts;

namespace magic.lambda.equality
{
    [Slot(Name = "or")]
    public class Or : ISlot
    {
        readonly ISignaler _signaler;

        public Or(IServiceProvider services)
        {
            _signaler = services.GetService(typeof(ISignaler)) as ISignaler;
        }

        public void Signal(Node input)
        {
            if (!input.Children.Any())
                throw new ApplicationException("Operator [or] requires at least one child node");

            foreach (var idx in input.Children)
            {
                if (idx.Name.FirstOrDefault() != '.')
                    _signaler.Signal(idx.Name, idx);
                if (idx.Get<bool>())
                {
                    input.Value = true;
                    return;
                }
            }
            input.Value = false;
        }
    }
}
