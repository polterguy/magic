/*
 * Magic Cloud, copyright (c) 2026 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.threading
{
    /// <summary>
    /// [execution.throttle] slot, enforcing a named throttle previously declared
    /// with [execution.throttle.create], throwing a 429 exception once the limit
    /// is exceeded.
    /// </summary>
    [Slot(
        Name = "execution.throttle",
        Description = "Enforces a named throttle previously declared with [execution.throttle.create], throwing a 429 exception once the limit is exceeded",
        ValueKind = "throttle-name",
        ValueDescription = "Name of the throttle to enforce, as previously declared with [execution.throttle.create]",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.None)]
    public class ExecutionThrottle : ISlot
    {
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var name = input.GetEx<string>() ??
                throw new HyperlambdaException("[execution.throttle] must be given a name");
            if (input.Children.Any())
                throw new HyperlambdaException("[execution.throttle] only accepts a name; configuration belongs to [execution.throttle.create]");
            if (!ExecutionThrottleCreate.Throttles.TryGetValue(name, out var throttle))
                throw new HyperlambdaException($"[execution.throttle] with name of '{name}' has not been declared, declare it with [execution.throttle.create]");

            throttle.Acquire(signaler, name);
        }
    }
}
