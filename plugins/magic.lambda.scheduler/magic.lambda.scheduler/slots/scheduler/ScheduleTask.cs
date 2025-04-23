/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Threading.Tasks;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.lambda.scheduler.contracts;
using magic.lambda.scheduler.utilities;
using magic.lambda.scheduler.slots.tasks;

namespace magic.lambda.scheduler.slots.scheduler
{
    /// <summary>
    /// [tasks.schedule] slot that will schedule an existing task for being executed, either
    /// according to some [repeats], or at a specific [due] date in the future.
    /// </summary>
    [Slot(Name = "tasks.schedule")]
    public class ScheduleTask : ISlotAsync
    {
        readonly ITaskScheduler _scheduler;

        /// <summary>
        /// Creates a new instance of your slot.
        /// </summary>
        /// <param name="scheduler">Which background service to use.</param>
        public ScheduleTask(ITaskScheduler scheduler)
        {
            _scheduler = scheduler;
        }

        /// <summary>
        /// Slot implementation.
        /// </summary>
        /// <param name="signaler">Signaler that raised signal.</param>
        /// <param name="input">Arguments to slot.</param>
        /// <returns>Awaitable task.</returns>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            var taskId = CreateTask.GetID(input);
            var pattern = input.Children.FirstOrDefault(x => x.Name == "repeats")?.GetEx<string>();
            if (pattern != null)
            {
                input.Value = await _scheduler.ScheduleTaskAsync(taskId, PatternFactory.Create(pattern));
            }
            else
            {
                var due = input
                    .Children
                    .FirstOrDefault(x => x.Name == "due")?
                    .GetEx<DateTime>() ?? 
                    throw new HyperlambdaException("No [due] or [repeats] provided to [tasks.schedule]");

                // Sanity checking invocation.
                if (due < DateTime.UtcNow)
                    throw new HyperlambdaException($"[tasks.schedule] cannot be invoked with a date and time being in the past.");
                input.Value = await _scheduler.ScheduleTaskAsync(taskId, due);
            }
            input.Clear();
        }
    }
}
