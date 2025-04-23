/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using magic.node;
using magic.node.extensions;
using magic.lambda.branching;
using magic.lambda.contracts;
using magic.signals.contracts;

namespace magic.lambda.loops
{
    /// <summary>
    /// [while] slot that will evaluate its lambda object as long as its condition is true.
    /// </summary>
    [Slot(Name = "while")]
    public class While : ISlot
    {
        readonly LambdaSettings _settings;

        /// <summary>
        /// Creates an instance of your slot.
        /// </summary>
        /// <param name="settings">Configuration settings.</param>
        public While(LambdaSettings settings)
        {
            _settings = settings;
        }

        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        /// <returns>An awaitable task.</returns>
        public void Signal(ISignaler signaler, Node input)
        {
            // Storing termination node, to check if we should terminate early for some reasons.
            var terminate = signaler.Peek<Node>("slots.result");

            // Making sure we don't enter an infinite loop.
            int iterations = 0;
            int maxIterations = _settings.MaxWhileIterations;

            // Cloning entire node such that we can reset it after execution.
            var clone = input.Clone();

            // Looping while condition is true.
            while (Common.ConditionIsTrue(signaler, input))
            {
                // Making sure we don't exceed maximum number of iterations.
                if (iterations++ >= maxIterations)
                    throw new HyperlambdaException($"Your [while] loop exceeded the maximum number of iterations, which is {maxIterations}. Refactor your Hyperlambda, or increase your configuration setting.");

                // Executing lambda object associated with [while].
                signaler.Signal("eval", Common.GetLambda(input));

                // Checking if execution for some reasons was terminated.
                if (terminate != null && (terminate.Value != null || terminate.Children.Any()))
                    return;

                // Resetting lambda object back to its original state for our next iteration.
                input.Clear();
                input.AddRange(clone.Children.Select(x => x.Clone()));
            }

            // To make sure we're compatible with [if] and [else-if] as much as possible.
            input.Value = false;
        }
    }
}
