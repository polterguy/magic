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
    [Slot(Name = "unwrap-value")]
    public class UnwrapValue : ISlot, IMeta
    {
        public void Signal(Node input)
        {
            var dest = input.Get<Expression>().Evaluate(new Node[] { input }).ToList();
            foreach (var idx in dest)
            {
                var exp = idx.Get<Expression>().Evaluate(new Node[] { idx }).ToList();
                if (exp.Count() > 1)
                    throw new ApplicationException("Multiple sources found for [unwrap-value]");

                idx.Value = exp.FirstOrDefault()?.Value;
            }
        }

        public IEnumerable<Node> GetArguments()
        {
            yield return new Node(":", "x");
        }
    }
}
