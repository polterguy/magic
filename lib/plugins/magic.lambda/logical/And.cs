/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using System.Collections.Generic;
using magic.node;
using magic.signals.contracts;

namespace magic.lambda.logical
{
    [Slot(Name = "and")]
    public class And : ISlot, IMeta
    {
        readonly ISignaler _signaler;

        public And(IServiceProvider services)
        {
            _signaler = services.GetService(typeof(ISignaler)) as ISignaler;
        }

        public void Signal(Node input)
        {
            if (input.Children.Count() < 2)
                throw new ApplicationException("Operator [and] requires at least two children nodes");

            _signaler.Signal("eval", input);

            foreach (var idx in input.Children)
            {
                if (!idx.Get<bool>())
                {
                    input.Value = false;
                    return;
                }
            }
            input.Value = true;
        }

        public IEnumerable<Node> GetArguments()
        {
            yield return new Node("*", "*");
        }
    }
}
