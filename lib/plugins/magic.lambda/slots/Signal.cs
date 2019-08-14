/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using System.Collections.Generic;
using magic.node;
using magic.signals.contracts;

namespace magic.lambda.slots
{
    [Slot(Name = "signal")]
    public class Signalize : ISlot, IMeta
    {
        readonly ISignaler _signaler;

        public Signalize(IServiceProvider services)
        {
            _signaler = services.GetService(typeof(ISignaler)) as ISignaler;
        }

        public void Signal(Node input)
        {
            // Sanity checking invocation.
            if (input.Value == null)
                throw new ApplicationException("Keyword [signal] requires a value being the name of slot to invoke");

            // Retrieving slot's lambda.
            var slotName = input.Get<string>();
            var slot = Slot.GetSlot(slotName);
            var lambda = slot.Children.First((x) => x.Name == ".lambda");
            lambda.UnTie();

            // Sanity checking arguments.
            var slotArgs = slot.Children.FirstOrDefault((x) => x.Name == ".arguments");
            if (slotArgs == null || slotArgs.Children.Count() == 0)
            {
                if (input.Children.Any())
                    throw new ApplicationException($"Slot named [{slotName}] does not take arguments at all.");
            }
            else
            {
                foreach (var idxInputArg in input.Children)
                {
                    if (!slotArgs.Children.Any((x) => x.Name == idxInputArg.Name))
                        throw new ApplicationException($"Slot [{slotName}] does not know how to handle argument [{idxInputArg.Name}]");
                }
            }

            // Preparing and invoking our actual lambda invocation node.
            var args = new Node(".arguments");
            args.AddRange(input.Children);
            lambda.Insert(0, args);
            _signaler.Signal("eval", lambda);

            // Returning any returned nodes.
            input.Clear();
            if (lambda.Value != null)
                input.AddRange(lambda.GetList<Node>());
        }

        public IEnumerable<Node> GetArguments()
        {
            yield return new Node(":", "string");
        }
    }
}
