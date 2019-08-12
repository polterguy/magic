/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using magic.node;
using magic.signals.contracts;

namespace magic.lambda.change
{
    [Slot(Name = "unwrap-name")]
    public class UnwrapName : ISlot
    {
        public void Signal(Node input)
        {
            var dest = input.Get<Expression>().Evaluate(new Node[] { input });
            foreach (var idx in dest)
            {
                var exp = idx.Get<Expression>().Evaluate(new Node[] { idx });
                if (exp.Count() > 1)
                    throw new ApplicationException("Multiple sources found for [unwrap-value]");

                idx.Value = exp.FirstOrDefault()?.Name;
            }
        }
    }
}
