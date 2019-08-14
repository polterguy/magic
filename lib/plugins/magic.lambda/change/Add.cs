/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
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

            // Looping through each destination.
            foreach (var idxDest in dest)
            {
                // Looping through each source node and adding its children to currently iterated destination.
                foreach (var idxSource in input.Children.SelectMany((x) => x.Children))
                {
                    idxDest.Add(idxSource.Clone()); // Cloning in case of multiple destinations.
                }
            }
        }

        public IEnumerable<Node> GetArguments()
        {
            yield return new Node(":", "x");
            yield return new Node("*", "*");
        }
    }
}
