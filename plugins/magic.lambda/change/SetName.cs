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
    [Slot(Name = "set-name")]
    public class SetName : ISlot
    {
        readonly ISignaler _signaler;

        public SetName(ISignaler signaler)
        {
            _signaler = signaler ?? throw new ArgumentNullException(nameof(signaler));
        }

        public void Signal(Node input)
        {
            if (input.Children.Count() > 1)
                throw new ApplicationException("[set-name] can have maximum one child node");

            _signaler.Signal("eval", input);

            var source = input.Children.FirstOrDefault()?.GetEx<string>(_signaler) ?? "";
            foreach (var idx in input.Evaluate())
            {
                idx.Name = source;
            }
        }
    }
}
