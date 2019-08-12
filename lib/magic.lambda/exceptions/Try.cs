/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using magic.node;
using magic.signals.contracts;

namespace magic.lambda.logical
{
    [Slot(Name = "try")]
    public class Try : ISlot
    {
        readonly ISignaler _signaler;

        public Try(IServiceProvider services)
        {
            _signaler = services.GetService(typeof(ISignaler)) as ISignaler;
        }

        public void Signal(Node input)
        {
            var nextNodeName = input.Next?.Name;
            if (nextNodeName != ".catch" && nextNodeName != ".finally")
                throw new ApplicationException("You cannot have a [try] without following it with either a [.catch] or a [.finally]");

            try
            {
                _signaler.Signal("eval", input);
            }
            catch (Exception err)
            {
                // TODO: Refactor to keep code DRY.
                // TODO: Also make sure we can only have on [.catch] and [.finally] block
                var reThrow = true;
                if (nextNodeName == ".catch")
                {
                    var next = input.Next;
                    var args = new Node(".arguments");
                    args.Add(new Node("message", err.Message));
                    args.Add(new Node("type", err.GetType().FullName));
                    next.Insert(0, args);
                    _signaler.Signal("eval", next);
                    reThrow = false;
                }
                if (nextNodeName == ".finally")
                {
                    // To ensure finally is executed, we have to do it this way.
                    var final = input.Next;
                    if (final.Name != ".finally")
                        final = final.Next;
                    if (final != null)
                        _signaler.Signal("eval", final);
                }
                if (input.Next?.Next?.Name == ".finally")
                {
                    var final = input.Next.Next;
                    if (final.Name != ".finally")
                        final = final.Next;
                    if (final != null)
                        _signaler.Signal("eval", final);
                }
                if (reThrow)
                    throw;
            }

            var ensure = input.Next?.Name == ".finally" ? input.Next : input.Next?.Next;
            if (ensure != null)
                _signaler.Signal("eval", ensure);
        }
    }
}
