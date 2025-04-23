/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.slots
{
    /// <summary>
    /// [signal] slot for invoking dynamically created slots, that have been created with the [slots.create] slot.
    /// </summary>
    [Slot(Name = "signal")]
    [Slot(Name = "execute")]
    [Slot(Name = "try-signal")]
    public class SignalSlot : ISlotAsync
    {
        /// <summary>
        /// Slot implementation.
        /// </summary>
        /// <param name="signaler">Signaler that raised signal.</param>
        /// <param name="input">Arguments to slot.</param>
        /// <result>Arguments to slot.</result>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            // Checking if invocation's name is [execute] at which point we forward evaluate all descendant nodes.
            if (input.Name == "execute")
                Expression.Unwrap(GetDescendants(input), true);

            // Making sure we're able to handle returned values and nodes from slot implementation.
            var result = new Node();
            await signaler.ScopeAsync("slots.result", result, async () =>
            {
                // Evaluating lambda of slot, making sure we temporary clear any existing [whitelist] declarations.
                var lambda = GetLambda(signaler, input, input.Name != "try-signal");
                if (lambda != null)
                {
                    await signaler.ScopeAsync("whitelist", null, async () =>
                    {
                        await signaler.SignalAsync("eval", lambda);
                    });
                }

                // Clearing original lambda and adding result of invocation.
                input.Clear();
                input.Value = result.Value;
                input.AddRange(result.Children.ToList());
            });
        }

        #region [ -- Private helper methods -- ]

        /*
         * Helper method used when unwrapping nodes.
         */
        static IEnumerable<Node> GetDescendants(Node input)
        {
            if (!input.Children.Any())
                yield break;
            foreach (var idx in input.Children)
            {
                yield return idx;
                foreach (var idxInner in GetDescendants(idx))
                {
                    yield return idxInner;
                }
            }
        }

        /*
         * Returns the lambda execution object for the slot.
         */
        static Node GetLambda(ISignaler signaler, Node input, bool throws)
        {
            var name = input.GetEx<string>();

            // Verifying whitelist is either null or that dynamic slot exists in whitelist declaration.
            var whitelist = signaler.Peek<List<Node>>("whitelist");
            if (whitelist != null && !whitelist.Any(x => x.Name == "signal" && x.Get<string>() == name))
            {
                // Notice, if we're using [try-signal] we should not throw an exception when we don't find a slot.
                if (!throws)
                    return null;
                throw new HyperlambdaException($"Dynamic slot [{name}] does not exist in scope");
            }

            // Retrieving slot from cache.
            if (!Create._slots.TryGetValue(name, out Node lambda))
            {
                // Notice, if we're using [try-signal] we should not throw an exception when we don't find a slot.
                if (input.Name == "try-signal")
                    return null;
                throw new HyperlambdaException($"Dynamic slot [{name}] does not exist in scope");
            }

            // Cloning to avoid tampering with original slot.
            lambda = lambda.Clone();

            // Preparing arguments, if there are any.
            if (input.Children.Any())
                lambda.Insert(0, new Node(".arguments", null, input.Children.ToList()));

            return lambda;
        }

        #endregion
    }
}
