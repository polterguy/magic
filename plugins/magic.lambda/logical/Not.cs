/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using System.Collections.Generic;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.logical
{
    [Slot(Name = "not")]
    public class Not : ISlot
    {
        readonly ISignaler _signaler;

        public Not(ISignaler signaler)
        {
            _signaler = signaler ?? throw new ArgumentNullException(nameof(signaler));
        }

        public void Signal(Node input)
        {
            if (input.Children.Count() != 1)
                throw new ApplicationException("Operator [not] requires exactly one child");

            _signaler.Signal("eval", input);

            input.Value = !input.Children.First().GetEx<bool>(_signaler);
        }
    }
}
