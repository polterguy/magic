/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using System.Threading.Tasks;

namespace magic.lambda.exceptions
{
    /// <summary>
    /// [try] slot for evaluating a piece of lambda, and optionally either [.catch] or add [.finally] evaluations
    /// guaranteed to be evaluated even if some exception occurs.
    /// </summary>
    [Slot(
        Name = "try",
        Description = "Evaluates the protected body; pair with [.catch] to handle exceptions and/or [.finally] to always run cleanup",
        ReturnsMode = SlotReturnsMode.None,
        ProvidesScope = "try",
        SignatureType = typeof(global::magic.lambda.signatures.TrySignature))]
    public class Try : ISlotAsync
    {
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        /// <returns>An awaitable task.</returns>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            try
            {
                await signaler.SignalAsync("eval", input, skipWhitelist: true);
            }
            catch (Exception err)
            {
                var foundCatch = await ExecuteCatch(signaler, input, err);
                await ExecuteFinally(signaler, input);
                if (foundCatch)
                    return;
                else
                    throw;
            }
            await ExecuteFinally(signaler, input);
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
        static async Task<bool> ExecuteCatch(ISignaler signaler, Node input, Exception err)
        {
            if (input.Next?.Name == ".catch")
            {
                Node next = InsertException(input, err);
                await signaler.SignalAsync("eval", next, skipWhitelist: true);
                return true;
            }
            return false;
        }

        /*
         * Executes [.finally] if it exists.
         */
        static async Task ExecuteFinally(ISignaler signaler, Node input)
        {
            if (input.Next?.Name == ".finally")
                await signaler.SignalAsync("eval", input.Next, skipWhitelist: true);
            else if (input.Next?.Next?.Name == ".finally")
                await signaler.SignalAsync("eval", input.Next.Next, skipWhitelist: true);
        }

        #endregion
    }
}
