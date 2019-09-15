/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using System.Collections.Generic;
using magic.node;
using magic.signals.contracts;
using hl = magic.node.extensions;

namespace magic.lambda.change
{
    [Slot(Name = "unwrap")]
    public class Unwrap : ISlot
    {
        readonly ISignaler _signaler;

        public Unwrap(ISignaler signaler)
        {
            _signaler = signaler ?? throw new ArgumentNullException(nameof(signaler));
        }

        public void Signal(Node input)
        {
            foreach (var idx in input.Evaluate())
            {
                if (idx.Value is hl.Signal signal)
                {
                    _signaler.Signal(signal.Content.Name, signal.Content);
                    idx.Value = signal.Content.Value;
                }
                else if (idx.Value != null)
                {
                    var exp = idx.Evaluate();
                    if (exp.Count() > 1)
                        throw new ApplicationException("Multiple sources found for [unwrap]");

                    idx.Value = exp.FirstOrDefault()?.Value;
                }
            }
        }
    }
}
