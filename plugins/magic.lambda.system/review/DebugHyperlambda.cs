/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Threading.Tasks;
using magic.node;
using magic.signals.contracts;

namespace magic.lambda.system
{
    /// <summary>
    /// [system.debug] slot, evaluating its lambda while recording every slot invocation.
    /// </summary>
    [Slot(
        Name = "system.debug",
        Description = "Evaluates the child lambda while recording every slot invocation, returning the recording",
        ReturnsMode = SlotReturnsMode.Lambda,
        ReturnsKind = "recording,node-list",
        ReturnsDescription = "Resolves to one node per executed slot, each with [slot], [path], [elapsed] and [lambda] being the entire lambda object after that slot was invoked",
        ClonesLambda = true)]
    public class Debug : ISlotAsync
    {
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        /// <returns>An awaitable task.</returns>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            /*
             * Cloning the lambda into a detached root before evaluating it.
             *
             * This is not an optimisation but a correctness requirement - without it the lambda would
             * have this slot as its parent, so every expression navigating upwards would resolve one
             * level higher than it does in production, and the recording would be of code behaving
             * differently to the code being debugged.
             */
            var lambda = new Node();
            lambda.AddRange(input.Children.Select(x => x.Clone()));

            /*
             * The recorder [eval] appends to, named with a leading dot such that Hyperlambda cannot
             * reach it through the stack.
             */
            var recording = new Node(".debug.recorder");

            /*
             * An execution that throws is precisely the one worth recording, so the exception is
             * caught and returned as the last node of the recording rather than being allowed to
             * discard everything leading up to it.
             */
            Node error = null;

            /*
             * Scoping our own [slots.result], the same way [invoke] and [whitelist] do, such that a
             * [return] inside the lambda being debugged terminates that lambda instead of escaping
             * and terminating whoever invoked this slot.
             */
            var result = new Node();
            try
            {
                await signaler.ScopeAsync("slots.result", result, async () =>
                {
                    await signaler.ScopeAsync(".debug.recorder", recording, async () =>
                    {
                        await signaler.SignalAsync("eval", lambda);
                    });
                });
            }
            catch (Exception err)
            {
                error = new Node("error", err.Message);
                error.Add(new Node("type", err.GetType().FullName));
            }

            // Returning the recording, detaching the steps from the recorder before re-parenting them.
            var steps = recording.Children.ToList();
            recording.Clear();
            input.Clear();
            input.Value = null;
            input.AddRange(steps);

            // Whatever the debugged lambda returned, if anything, kept separate from the recording.
            if (result.Value != null || result.Children.Any())
            {
                var returned = new Node("returned", result.Value);
                returned.AddRange(result.Children.ToList());
                input.Add(returned);
            }
            if (error != null)
                input.Add(error);
        }
    }
}
