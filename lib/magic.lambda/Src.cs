/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using magic.node;
using magic.signals.contracts;

namespace magic.lambda
{
    [Slot(Name = "src")]
    public class Src : ISlot
    {
        public void Signal(Node input)
        {
            var src = input.Get<Expression>().Evaluate(new Node[] { input });
            foreach (var idx in src)
            {
                input.Add(idx.Clone());
            }
        }
    }
}
