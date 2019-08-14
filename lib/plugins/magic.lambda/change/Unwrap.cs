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
    [Slot(Name = "unwrap")]
    public class Unwrap : ISlot, IMeta
    {
        public void Signal(Node input)
        {
            foreach (var idx in input.Evaluate())
            {
                var exp = idx.Evaluate();
                if (exp.Count() > 1)
                    throw new ApplicationException("Multiple sources found for [unwrap]");

                idx.Value = exp.FirstOrDefault()?.Value;
            }
        }

        public IEnumerable<Node> GetArguments()
        {
            yield return new Node(":", "x");
        }
    }
}
