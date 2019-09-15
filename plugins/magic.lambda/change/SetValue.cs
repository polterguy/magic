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

namespace magic.lambda.change
{
    [Slot(Name = "set-value")]
    public class SetValue : ISlot
    {
        readonly ISignaler _signaler;

        public SetValue(ISignaler signaler)
        {
            _signaler = signaler ?? throw new ArgumentNullException(nameof(signaler));
        }

        public void Signal(Node input)
        {
            if (input.Children.Count() > 1)
                throw new ApplicationException("[set-value] can have maximum one child node");

            var destinations = input.Evaluate().ToList();
            if (destinations.Count == 0)
                return;

            _signaler.Signal("eval", input);

            var source = input.Children.FirstOrDefault()?.GetEx(_signaler);
            foreach (var idx in destinations)
            {
                idx.Value = source;
            }
        }
    }
}
