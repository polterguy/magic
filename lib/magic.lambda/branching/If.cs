/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using magic.node;
using magic.signals.contracts;

namespace magic.lambda.branching
{
    [Slot(Name = "if")]
    public class If : ISlot
    {
        readonly ISignaler _signaler;

        public If(IServiceProvider services)
        {
            _signaler = services.GetService(typeof(ISignaler)) as ISignaler;
        }

        public void Signal(Node input)
        {
            if (input.Children.Count() != 2)
                throw new ApplicationException("Keyword [if] requires exactly two child nodes");

            var lambda = input.Children.Skip(1).First();
            if (lambda.Name != ".lambda")
                throw new ApplicationException("Keyword [if] requires its second child to be [.lambda]");

            var condition = input.Children.First();
            if (condition.Name.FirstOrDefault() != '.')
                _signaler.Signal(condition.Name, condition);

            if (condition.Get<bool>())
                _signaler.Signal("eval", lambda);
        }
    }
}
