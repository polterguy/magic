/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using System.Collections.Generic;
using magic.node;
using magic.lambda.utilities;
using magic.signals.contracts;

namespace magic.lambda.change
{
    [Slot(Name = "set-node")]
    public class SetNode : ISlot, IMeta
    {
        readonly ISignaler _signaler;

        public SetNode(IServiceProvider services)
        {
            _signaler = services.GetService(typeof(ISignaler)) as ISignaler;
        }

        public void Signal(Node input)
        {
            if (input.Children.Count() > 1)
                throw new ApplicationException("[set-node] can only have maximum one child node");

            var destinations = input.Evaluate();

            var sourceNode = input.Children.FirstOrDefault();
            if (sourceNode?.Children.Count() > 1)
                throw new ApplicationException("[set-node] can only handle one source node");

            _signaler.Signal("eval", input);

            var source = sourceNode?.Children.FirstOrDefault();

            if (source == null)
            {
                // To avoid modifying collection during enumeration removal process we invoke ToList.
                foreach (var idx in destinations.ToList())
                {
                    idx.Parent.Remove(idx);
                }
            }
            else
            {
                foreach (var idx in destinations)
                {
                    idx.Name = source.Name;
                    idx.Value = source.Value;
                    idx.Clear();
                    foreach (var idxSrcChild in source.Children.ToList())
                    {
                        // Cloning to avoid removing original node from its original collection.
                        idx.Add(idxSrcChild.Clone());
                    }
                }
            }
        }

        public IEnumerable<Node> GetArguments()
        {
            yield return new Node("*", 1);
            yield return new Node(":", "x");
        }
    }
}
