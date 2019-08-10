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
    [Slot(Name = "set-name")]
    public class SetName : ISlot
    {
        IServiceProvider _services;

        public SetName(IServiceProvider services)
        {
            _services = services ?? throw new ArgumentNullException(nameof(services));
        }

        public void Signal(Node input)
        {
            var signaler = _services.GetService(typeof(ISignaler)) as ISignaler;
            var dest = input.Get<Expression>().Evaluate(new Node[] { input });
            signaler.Signal("eval", input);
            if (input.Children.Count() > 1)
                throw new ApplicationException("Too many sources for [set-name]");
            var source = input.Children.FirstOrDefault()?.Get<string>() ?? "";
            foreach (var idx in dest)
            {
                idx.Name = source;
            }
        }
    }
}
