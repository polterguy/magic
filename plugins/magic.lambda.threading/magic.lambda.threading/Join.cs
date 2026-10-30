/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.Extensions.DependencyInjection;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.threading
{
    /// <summary>
    /// [join] slot, waiting for all (direct) children [fork] invocations to finish their work,
    /// before allowing execution to continue.
    /// </summary>
    [Slot(
        Name = "join",
        Description = "Waits for one or more child [fork] operations to finish before proceeding",
        ReturnsMode = SlotReturnsMode.Lambda,
        ReturnsKind = "fork-result-list,node-list",
        ReturnsDescription = "Resolves to the completed [fork] child nodes with evaluated body node values and children preserved",
        ProvidesScope = "join",
        SignatureType = typeof(global::magic.lambda.threading.signatures.JoinSignature))]
    public class Join : ISlotAsync
    {
        readonly IServiceScopeFactory _serviceScopeFactory;

        /// <summary>
        /// Creates an instance of your type
        /// </summary>
        /// <param name="serviceScopeFactory">Used to create new scope to prevent race conditions</param>
        public Join(IServiceScopeFactory serviceScopeFactory)
        {
            _serviceScopeFactory = serviceScopeFactory;
        }

        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        /// <returns>An awaiatble task.</returns>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            // All tasks we're waiting for.
            var tasks = new List<(Task, Node)>();

            /*
             * Each thread gets its own signaler, hence its own stack - so the caller's context
             * objects must be carried across explicitly. Without the ticket the lambda evaluates as
             * anonymous, without the execution context it cannot be cancelled or timed out, and
             * without the whitelist it evaluates with the full vocabulary of the server.
             *
             * Notice, no reference counting on the execution context as [fork] does, since we await
             * every thread below - the caller's own reference outlives all of them.
             */
            var auth = new Node();
            await signaler.SignalAsync("auth.ticket.get", auth, skipWhitelist: true);
            var execution = signaler.GetExecutionContext();
            var whitelist = signaler.Peek<List<Node>>("whitelist");

            // Looping through each child node of input.
            foreach (var idxThread in input.Children)
            {
                // Sanity checking name of node.
                if (idxThread.Name != "fork")
                    throw new HyperlambdaException("[join] can only have [fork] children");

                // Wee need to clone node for thread to avoid race conditions.
                var clone = idxThread.Clone();
                var authClone = auth.Value == null ? null : auth.Clone();
                var curTask = Task.Run(() => EvaluateInThreadAsync(clone, authClone, execution, whitelist));
                tasks.Add((curTask, clone));
            }
            await Task.WhenAll(tasks.Select(x => x.Item1).ToArray());
            input.Clear();
            input.AddRange(tasks.Select(x => x.Item2).ToArray());
        }

        #region [ -- Private helper methods -- ]

        /*
         * Evaluates the specified clone on the current thread, with the caller's context objects scoped.
         *
         * Notice, ISignaler is NOT thread safe, since it preserves state on a per thread individual basis.
         * Also notice, one layer per context object, scoping each only when we actually have it - a null must
         * never reach the stack, since a scoped null masks an object of the same name further up.
         */
        async Task EvaluateInThreadAsync(
            Node clone,
            Node authClone,
            ExecutionContext execution,
            List<Node> whitelist)
        {
            using (var scope = _serviceScopeFactory.CreateScope())
            {
                var threadSignaler = scope.ServiceProvider.GetService<ISignaler>();
                if (whitelist == null)
                    await WithAuthAsync(threadSignaler, clone, authClone, execution);
                else
                    await threadSignaler.ScopeAsync("whitelist", whitelist, () => WithAuthAsync(threadSignaler, clone, authClone, execution));
            }
        }

        static async Task WithAuthAsync(ISignaler signaler, Node clone, Node authClone, ExecutionContext execution)
        {
            if (authClone == null)
                await WithExecutionAsync(signaler, clone, execution);
            else
                await signaler.ScopeAsync(".auth.ticket.get", authClone, () => WithExecutionAsync(signaler, clone, execution));
        }

        static async Task WithExecutionAsync(ISignaler signaler, Node clone, ExecutionContext execution)
        {
            if (execution == null)
                await EvaluateAsync(signaler, clone);
            else
                await signaler.ScopeAsync("execution.context", execution, async () =>
                    await signaler.ScopeAsync("dynamic.execution-id", execution.ExecutionId, () => EvaluateAsync(signaler, clone)));
        }

        static async Task EvaluateAsync(ISignaler signaler, Node clone)
        {
            await signaler.SignalAsync("eval", clone, skipWhitelist: true);
        }

        #endregion
    }
}
