/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System.Linq;
using System.Collections.Generic;
using magic.node;
using magic.signals.contracts;
using magic.hyperlambda.utils;

namespace magic.hyperlambda
{
    [Slot(Name = "lambda")]
    public class Lambda : ISlot, IMeta
    {
        public void Signal(Node input)
        {
            var parser = new Parser(input.Get<string>());
            input.AddRange(parser.Lambda().Children.ToList());
            input.Value = null;
        }

        public IEnumerable<Node> GetArguments()
        {
            yield return new Node(":", "*");
        }
    }
}
