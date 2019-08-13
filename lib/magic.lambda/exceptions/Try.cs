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
            try
            {
                _signaler.Signal("eval", input);
            }
            catch (Exception err)
            {
                if (ExecuteCatch(input, err))
                {
                    ExecuteFinally(input);
                    return; // ExecuteCatch found a [.catch], hence not rethrowing.
                }
                ExecuteFinally(input);
                throw; // Rethrow since ExecuteCatch didn't find any [.catch].
            }

            ExecuteFinally(input);
        }

        #region [ -- Private helper methods -- ]

        /*
         * Executes [.catch] if existing, and returns true if [.catch] was found
         */
        bool ExecuteCatch(Node input, Exception err)
        {
            if (input.Next?.Name == ".catch")
            {
                var next = input.Next;
                var args = new Node(".arguments");
                args.Add(new Node("message", err.Message));
                args.Add(new Node("type", err.GetType().FullName));
                next.Insert(0, args);
                _signaler.Signal("eval", next);
                return true;
            }
            return false;
        }

        /*
         * Executes [.finally] if it exists.
         */
        void ExecuteFinally(Node input)
        {
            if (input.Next?.Name == ".finally")
                _signaler.Signal("eval", input.Next);
            else if (input.Next?.Next?.Name == ".finally")
                _signaler.Signal("eval", input.Next.Next);
        }

        #endregion
    }
}
