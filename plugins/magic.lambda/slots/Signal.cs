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

        public Signalize(ISignaler signaler)
        {
            _signaler = signaler ?? throw new ArgumentNullException(nameof(signaler));
        }

        public void Signal(Node input)
        {
            // Retrieving slot's lambda.
            var slotName = input.Get<string>() ?? throw new ApplicationException("Keyword [signal] requires a value being the name of slot to invoke");
            var slotNode = Slot.GetSlot(slotName);
            var lambda = slotNode.Children.First((x) => x.Name == ".lambda");

            // Making sure lambda becomes its own root node.
            lambda.UnTie();

            // Sanity checking arguments.
            var slotArgs = slotNode.Children.FirstOrDefault((x) => x.Name == ".arguments");
            if (slotArgs?.Children.Any((x) => x.Name == "*") == false)
            {
                // No "accept all arguments" declaration.
                if (input.Children.Any() && (slotArgs == null || slotArgs.Children.Count() == 0))
                {
                    throw new ApplicationException($"Slot named [{slotName}] does not take arguments at all.");
                }
                foreach (var idxInputArg in input.Children)
                {
                    if (!slotArgs.Children.Any((x) => x.Name == idxInputArg.Name))
                        throw new ApplicationException($"Slot [{slotName}] does not know how to handle argument [{idxInputArg.Name}]");
                }
            }

            // Preparing arguments, making sure we clon ethem to avoid that enumeration process is aborted.
            var args = new Node(".arguments");
            args.AddRange(input.Children.Select((x) => x.Clone()));
            lambda.Insert(0, args);

            // Evaluating lambda of slot.
            _signaler.Signal("eval", lambda);

            // Returning any returned nodes from lambda.
            input.Clear();
            input.Value = null;
            if (lambda.Value is IEnumerable<Node> nodes)
                input.AddRange(nodes.ToList());
            else
                input.Value = lambda.Value;
        }

        public IEnumerable<Node> GetArguments()
        {
            yield return new Node(":", "*");
            yield return new Node("*", "*");
        }
    }
}
