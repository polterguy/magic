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
    [Slot(Name = "add")]
    public class Add : ISlot
    {
        readonly ISignaler _signaler;

        public Add(ISignaler signaler)
        {
            _signaler = signaler ?? throw new ArgumentNullException(nameof(signaler));
        }

        public void Signal(Node input)
        {
            _signaler.Signal("eval", input);

            // Looping through each destination.
            foreach (var idxDest in input.Evaluate())
            {
                // Looping through each source node and adding its children to currently iterated destination.
                foreach (var idxSource in input.Children.SelectMany(x => x.Children))
                {
                    idxDest.Add(idxSource.Clone()); // Cloning in case of multiple destinations.
                }
            }
        }
    }
}
