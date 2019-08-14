/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using System.Collections.Generic;
using magic.node;
using magic.signals.contracts;

namespace magic.lambda
{
    [Slot(Name = "-")]
    public class Subtract : ISlot, IMeta
    {
        readonly ISignaler _signaler;

        public Subtract(IServiceProvider services)
        {
            _signaler = services.GetService(typeof(ISignaler)) as ISignaler;
        }

        public void Signal(Node input)
        {
            _signaler.Signal("eval", input);
            input.Value = input.Children.First().Get<dynamic>() - input.Children.Skip(1).Sum((x) => x.Get<dynamic>());
        }

        public IEnumerable<Node> GetArguments()
        {
            yield return new Node("*", "*");
        }
    }
}
