/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using System.Collections.Generic;
using magic.node;
using magic.signals.contracts;

namespace magic.lambda.loops
{
    [Slot(Name = "while")]
    public class While : ISlot, IMeta
    {
        readonly ISignaler _signaler;

        public While(IServiceProvider services)
        {
            _signaler = services.GetService(typeof(ISignaler)) as ISignaler;
        }

        public void Signal(Node input)
        {
            if (input.Children.Count() != 2)
                throw new ApplicationException("Keyword [while] requires exactly two child nodes");

            while(true)
            {
                var old = input.Children.Select((x) => x.Clone()).ToList();

                var lambda = input.Children.Skip(1).First();
                if (lambda.Name != ".lambda")
                    throw new ApplicationException("Keyword [while] requires its second child to be [.lambda]");

                var condition = input.Children.First();
                if (condition.Name.FirstOrDefault() != '.')
                    _signaler.Signal(condition.Name, condition);

                if (!condition.Get<bool>())
                    break;

                _signaler.Signal("eval", lambda);

                input.Clear();
                input.AddRange(old);
            }
        }

        public IEnumerable<Node> GetArguments()
        {
            yield return new Node("*", 1);
            yield return new Node(".lambda", 1);
        }
    }
}
