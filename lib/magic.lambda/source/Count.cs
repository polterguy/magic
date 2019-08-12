/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using magic.node;
using magic.signals.contracts;

namespace magic.lambda.source
{
    [Slot(Name = "count")]
    public class Count : ISlot
    {
        public void Signal(Node input)
        {
            if (input.Value == null)
                throw new ApplicationException("No expression source provided for [count]");

            var src = input.Get<Expression>().Evaluate(new Node[] { input });
            input.Value = src.Count();
        }
    }
}
