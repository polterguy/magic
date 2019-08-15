/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using magic.node;
using magic.signals.contracts;

namespace magic.console.lambda
{
    [Slot(Name = "write")]
    public class Write : ISlot
    {
        public void Signal(Node input)
        {
            var val = input.Value;
            if (val is Expression ex)
            {
                var node = ex.Evaluate(new Node[] { input }).ToList();
                if (node.Count() != 1)
                    throw new ApplicationException("too many source found for [write-line]");

                val = node.First().Value;
            }
            if (val == null)
                throw new ApplicationException("Cannot write 'null' to the console");

            Console.Write(val);
        }
    }
}
