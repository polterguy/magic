/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System.Linq;
using magic.node;
using magic.signals.contracts;
using magic.node.extensions.hyperlambda;

namespace magic.lambda.hyperlambda
{
    [Slot(Name = "lambda")]
    public class Lambda : ISlot
    {
        public void Signal(Node input)
        {
            var parser = new Parser(input.Get<string>());
            input.AddRange(parser.Lambda().Children.ToList());
            input.Value = null;
        }
    }
}
