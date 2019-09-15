/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using System.Collections.Generic;
using magic.node;
using magic.signals.contracts;

namespace magic.lambda.loops
{
    [Slot(Name = "for-each")]
    public class ForEach : ISlot
    {
        readonly ISignaler _signaler;

        public ForEach(ISignaler signaler)
        {
            _signaler = signaler ?? throw new ArgumentNullException(nameof(signaler));
        }

        public void Signal(Node input)
        {
            // Making sure we can reset back to original nodes after every single iteration.
            var old = input.Children.Select(x => x.Clone()).ToList();

            foreach (var idx in input.Evaluate())
            {
                // Inserting "data pointer".
                input.Insert(0, new Node(".dp", idx));

                // Evaluating "body" lambda of [for-each]
                _signaler.Signal("eval", input);

                // Resetting back to original nodes.
                input.Clear();

                // Notice, cloning in case we've got another iteration, to avoid changing original nodes' values.
                input.AddRange(old.Select(x => x.Clone()));
            }
        }
    }
}
