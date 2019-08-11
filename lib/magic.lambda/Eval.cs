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
    [Slot(Name = "eval")]
    public class Eval : ISlot
    {
        readonly ISignaler _signaler;

        public Eval(IServiceProvider services)
        {
            _signaler = services.GetService(typeof(ISignaler)) as ISignaler;
        }

        public void Signal(Node input)
        {
            if (input.Name == "eval" && input.Value != null && input.Children.Any())
                throw new ApplicationException("[eval] cannot handle both expression values and children at the same time");

            // Children have precedence, in case invocation is from a non [eval] keyword.
            if (input.Children.Any())
            {
                foreach (var idx in input.Children)
                {
                    if (idx.Name.FirstOrDefault() == '.')
                        continue;
                    _signaler.Signal(idx.Name, idx);
                }
            }
            else
            {
                var nodes = input.Get<Expression>().Evaluate(new Node[] { input });
                foreach (var idxOuter in nodes)
                {
                    foreach (var idx in idxOuter.Children)
                    {
                        if (idx.Name.FirstOrDefault() == '.')
                            continue;
                        _signaler.Signal(idx.Name, idx);
                    }
                }
            }
        }
    }
}
