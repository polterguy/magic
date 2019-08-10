/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using magic.node;
using magic.signals.contracts;

namespace magic.lambda
{
    [Slot(Name = "value")]
    public class Value : ISlot
    {
        public void Signal(Node input)
        {
            var src = input.Get<Expression>().Evaluate(new Node[] { input });
            if (src.Count() > 1)
                throw new ApplicationException("Too many nodes returned from [value] expression");
            input.Value = src.FirstOrDefault()?.Value ?? null;
        }
    }
}
