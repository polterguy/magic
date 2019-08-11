/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using magic.node;
using magic.signals.contracts;

namespace magic.lambda.logical
{
    [Slot(Name = "and")]
    public class And : ISlot
    {
        readonly ISignaler _signaler;

        public And(IServiceProvider services)
        {
            _signaler = services.GetService(typeof(ISignaler)) as ISignaler;
        }

        public void Signal(Node input)
        {
            if (!input.Children.Any())
                throw new ApplicationException("Operator [and] requires at least one child node");

            _signaler.Signal("eval", input);
            foreach (var idx in input.Children)
            {
                if (!idx.Get<bool>())
                {
                    input.Value = false;
                    return;
                }
            }
            input.Value = true;
        }
    }
}
