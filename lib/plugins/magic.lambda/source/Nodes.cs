/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System.Collections.Generic;
using magic.node;
using magic.signals.contracts;

namespace magic.lambda.source
{
    [Slot(Name = "nodes")]
    public class Nodes : ISlot, IMeta
    {
        public void Signal(Node input)
        {
            if (input.Value == null)
                return;

            var src = input.Get<Expression>().Evaluate(new Node[] { input });
            foreach (var idx in src)
            {
                input.Add(idx.Clone());
            }
        }

        public IEnumerable<Node> GetArguments()
        {
            yield return new Node(":", "x");
        }
    }
}
