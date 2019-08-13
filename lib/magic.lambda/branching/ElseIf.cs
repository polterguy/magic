/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Collections.Generic;
using System.Linq;
using magic.node;
using magic.signals.contracts;

namespace magic.lambda.branching
{
    [Slot(Name = "else-if")]
    public class ElseIf : ISlot, IMeta
    {
        readonly ISignaler _signaler;

        public ElseIf(IServiceProvider services)
        {
            _signaler = services.GetService(typeof(ISignaler)) as ISignaler;
        }

        public void Signal(Node input)
        {
            if (input.Children.Count() != 2)
                throw new ApplicationException("Keyword [else-if] requires exactly two children nodes");

            var lambda = input.Children.Skip(1).First();
            if (lambda.Name != ".lambda")
                throw new ApplicationException("Keyword [else-if] requires its second child node to be [.lambda]");

            var previous = input.Previous;
            if (previous == null || (previous.Name != "if" && previous.Name != "else-if"))
                throw new ApplicationException("[else-if] must have an [if] or [else-if] before it");

            var evaluate = true;
            while (previous != null && (previous.Name == "if" || previous.Name == "else-if"))
            {
                if (previous.Children.First().Get<bool>())
                {
                    evaluate = false;
                    break;
                }
                previous = previous.Previous;
            }

            if (evaluate)
            {
                var condition = input.Children.First();
                if (condition.Name.FirstOrDefault() != '.')
                    _signaler.Signal(condition.Name, condition);

                if (condition.Get<bool>())
                    _signaler.Signal("eval", lambda);
            }
        }

        public IEnumerable<Node> GetArguments()
        {
            yield return new Node("*", 1);
            yield return new Node(".lambda", 1);
        }
    }
}
