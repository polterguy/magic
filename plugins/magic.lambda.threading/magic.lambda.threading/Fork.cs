/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.Extensions.DependencyInjection;
using magic.node;
using magic.signals.contracts;
using magic.node.extensions;
using System.Linq;

namespace magic.lambda.threading
{
    /// <summary>
    /// [fork] slot, allowing you to create and start a new thread.
    /// </summary>
    [Slot(
        Name = "fork",
        Description = "Spawns a fire-and-forget background thread that evaluates the child lambda; the parent continues immediately",
        ReturnsMode = SlotReturnsMode.None,
        ProvidesScope = "fork",
        ClonesLambda = true,
        SignatureType = typeof(global::magic.lambda.threading.signatures.ForkSignature))]
    public class Fork : ISlotAsync
    {
        readonly IServiceScopeFactory _serviceScopeFactory;
        readonly IExecutionRegistry _executionRegistry;

        /// <summary>
        /// Creates an instance of your type
        /// </summary>
        /// <param name="serviceScopeFactory">Used to create new scope to prevent race conditions</param>
        /// <param name="executionRegistry">Needed to release our reference to the execution context once the thread is done</param>
        public Fork(IServiceScopeFactory serviceScopeFactory, IExecutionRegistry executionRegistry)
        {
            _serviceScopeFactory = serviceScopeFactory;
            _executionRegistry = executionRegistry;
        }

        #pragma warning disable 1998
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        /// <returns>An awaiatble task.</returns>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            // Retrieving username, roles, and claims, if these exists.
            var auth = new Node();
            signaler.Signal("auth.ticket.get", auth, skipWhitelist: true);
            var execution = signaler.GetExecutionContext();
            if (execution != null && !execution.AddReference())
                execution = null;

            /*
             * Each thread gets its own signaler, hence its own stack - so a whitelist currently in
             * scope must be carried across explicitly, otherwise the forked lambda evaluates with
             * the full vocabulary of the server.
             */
            var whitelist = signaler.Peek<List<Node>>("whitelist");

            // Notice, NOT awaiting task, which is intentional to ensure we're creating a "fire and forget" thread.
            _ = Task.Run(async () => 
            {
                // Notice, ISignaler is NOT thread safe, since it preserves state on a per thread individual basis.
                try
                {
                    using (var scope = _serviceScopeFactory.CreateScope())
                    {
                        var threadSignaler = scope.ServiceProvider.GetService<ISignaler>();

                        /*
                         * Passing the caller's context objects into the thread, one layer per object,
                         * scoping each only when we actually have it - a null must never reach the
                         * stack, since a scoped null masks an object of the same name further up.
                         */
                        async Task Evaluate()
                        {
                            await threadSignaler.SignalAsync("eval", input.Clone(), skipWhitelist: true);
                        }
                        async Task WithExecution()
                        {
                            if (execution == null)
                                await Evaluate();
                            else
                                await threadSignaler.ScopeAsync("execution.context", execution, async () =>
                                    await threadSignaler.ScopeAsync("dynamic.execution-id", execution.ExecutionId, Evaluate));
                        }
                        async Task WithAuth()
                        {
                            if (auth.Value == null)
                                await WithExecution();
                            else
                                await threadSignaler.ScopeAsync(".auth.ticket.get", auth.Clone(), WithExecution);
                        }
                        if (whitelist == null)
                            await WithAuth();
                        else
                            await threadSignaler.ScopeAsync("whitelist", whitelist, WithAuth);
                    }
                }
                finally
                {
                    /*
                     * Releasing through the registry rather than the context itself, such that
                     * whichever of us and the creating endpoint finishes LAST is the one that
                     * removes the registration and disposes the context. Releasing the context
                     * directly would orphan it in the registry whenever the thread outlives the
                     * endpoint - which is the entire point of a fire and forget thread.
                     */
                    if (execution != null)
                        _executionRegistry.Complete(execution.ExecutionId);
                }
            });
        }
        #pragma warning restore 1998
    }
}
