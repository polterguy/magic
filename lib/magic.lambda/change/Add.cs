/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Collections.Generic;
using magic.node;
using magic.signals.contracts;

namespace magic.lambda.change
{
    [Slot(Name = "add")]
    public class Add : ISlot, IMeta
    {
        readonly ISignaler _signaler;

        public Add(IServiceProvider services)
        {
            _signaler = services.GetService(typeof(ISignaler)) as ISignaler;
        }

        public void Signal(Node input)
        {
            var dest = input.Get<Expression>().Evaluate(new Node[] { input });
            _signaler.Signal("eval", input);
            foreach (var idxSource in input.Children)
            {
                foreach(var idxDest in dest)
                {
                    foreach (var idxSourceUnwrapped in idxSource.Children)
                    {
                        idxDest.Add(idxSourceUnwrapped);
                    }
                }
            }
        }

        public IEnumerable<Node> GetArguments()
        {
            yield return new Node("*", "*");
        }
    }
}
