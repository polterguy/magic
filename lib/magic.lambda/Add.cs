/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using magic.node;
using magic.signals.contracts;

namespace magic.lambda
{
    [Slot(Name = "add")]
    public class Add : ISlot
    {
        IServiceProvider _services;

        public Add(IServiceProvider services)
        {
            _services = services ?? throw new ArgumentNullException(nameof(services));
        }

        public void Signal(Node input)
        {
            var signaler = _services.GetService(typeof(ISignaler)) as ISignaler;
            var destinations = input.Get<Expression>().Evaluate(new Node[] { input });
            foreach (var idxSource in input.Children)
            {
                signaler.Signal(idxSource.Name, idxSource);
                foreach(var idxDest in destinations)
                {
                    foreach (var idxSourceUnwrapped in idxSource.Children)
                    {
                        idxDest.Add(idxSourceUnwrapped);
                    }
                }
            }
        }
    }
}
