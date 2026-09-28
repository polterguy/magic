/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Threading.Tasks;
using Sys = System.Threading;
using System.Collections.Concurrent;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.threading
{
    /// <summary>
    /// [semaphore] slot, allowing you to create a semaphore,
    /// only allowing one caller entry into some lambda object at the same time.
    /// </summary>
    [Slot(
        Name = "semaphore",
        Description = "Serializes access to a critical section by name; only one thread at a time can enter a given semaphore",
        ValueKind = "semaphore-name",
        ValueDescription = "Semaphore name used to serialize access",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.None,
        ProvidesScope = "semaphore",
        SignatureType = typeof(global::magic.lambda.threading.signatures.SemaphoreSignature))]
    public class Semaphore : ISlotAsync
    {
        static readonly ConcurrentDictionary<string, Sys.SemaphoreSlim> _semaphores = new();

        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        /// <returns>An awaitable task.</returns>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            var key = GetKey(input);

            var semaphore = _semaphores.GetOrAdd(key, (name) =>
            {
                return new Sys.SemaphoreSlim(1);
            });
            await semaphore.WaitAsync();
            try
            {
                await signaler.SignalAsync("eval", input, skipWhitelist: true);
            }
            finally
            {
                semaphore.Release();
            }
        }

        #region [ -- Private helper methods -- ]

        static string GetKey(Node input)
        {
            return input.GetEx<string>() ??
                throw new HyperlambdaException("A semaphore must have a value, used to uniquely identity your semaphore");
        }

        #endregion
    }
}
