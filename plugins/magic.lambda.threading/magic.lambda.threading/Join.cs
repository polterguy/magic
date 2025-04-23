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
    [Slot(Name = "join")]
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

            // Looping through each child node of input.
            foreach (var idxThread in input.Children)
            {
                // Sanity checking name of node.
                if (idxThread.Name != "fork")
                    throw new HyperlambdaException("[join] can only have [fork] children");

                // Wee need to clone node for thread to avoid race conditions.
                var clone = idxThread.Clone();
                var curTask = Task.Factory.StartNew(() => 
                {
                    // Notice, ISignaler is NOT thread safe, since it preserves state on a per thread individual basis.
                    using (var scope = _serviceScopeFactory.CreateScope())
                    {
                        var threadSignaler = scope.ServiceProvider.GetService<ISignaler>();
                        threadSignaler.Signal("eval", clone);
                    }
                });
                tasks.Add((curTask, clone));
            }
            await Task.WhenAll(tasks.Select(x => x.Item1).ToArray());
            input.Clear();
            input.AddRange(tasks.Select(x => x.Item2).ToArray());
        }
    }
}
