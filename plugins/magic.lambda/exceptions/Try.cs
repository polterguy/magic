/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Collections.Generic;
using magic.node;
using magic.signals.contracts;

namespace magic.lambda.exceptions
{
    [Slot(Name = "try")]
    public class Try : ISlot, IMeta
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
                var foundCatch = ExecuteCatch(input, err);
                ExecuteFinally(input);
                if (foundCatch)
                    return;
                else
                    throw;
            }
            ExecuteFinally(input);
        }

        public IEnumerable<Node> GetArguments()
        {
            yield return new Node("*", "*");
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
