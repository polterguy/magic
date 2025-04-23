/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.exceptions
{
    /// <summary>
    /// [try] slot for evaluating a piece of lambda, and optionally either [.catch] or add [.finally] evaluations
    /// guaranteed to be evaluated even if some exception occurs.
    /// </summary>
    [Slot(Name = "try")]
    public class Try : ISlot
    {
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        /// <returns>An awaitable task.</returns>
        public void Signal(ISignaler signaler, Node input)
        {
            try
            {
                signaler.Signal("eval", input);
            }
            catch (Exception err)
            {
                var foundCatch = ExecuteCatch(signaler, input, err);
                ExecuteFinally(signaler, input);
                if (foundCatch)
                    return;
                else
                    throw;
            }
            ExecuteFinally(signaler, input);
        }

        #region [ -- Private helper methods -- ]

        static Node InsertException(Node input, Exception err)
        {
            var next = input.Next;
            var args = new Node(".arguments");
            args.Add(new Node("message", err.Message));
            args.Add(new Node("type", err.GetType().FullName));
            if (err is HyperlambdaException hl)
            {
                args.Add(new Node("status", hl.Status));
                args.Add(new Node("public", hl.IsPublic));
                args.Add(new Node("field", hl.FieldName));
            }
            next.Insert(0, args);
            return next;
        }

        /*
         * Executes [.catch] if existing, and returns true if [.catch] was found
         */
        bool ExecuteCatch(ISignaler signaler, Node input, Exception err)
        {
            if (input.Next?.Name == ".catch")
            {
                Node next = InsertException(input, err);
                signaler.Signal("eval", next);
                return true;
            }
            return false;
        }

        /*
         * Executes [.finally] if it exists.
         */
        static void ExecuteFinally(ISignaler signaler, Node input)
        {
            if (input.Next?.Name == ".finally")
                signaler.Signal("eval", input.Next);
            else if (input.Next?.Next?.Name == ".finally")
                signaler.Signal("eval", input.Next.Next);
        }

        #endregion
    }
}
