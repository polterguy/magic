/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Threading.Tasks;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.lambda.scheduler.contracts;

namespace magic.lambda.scheduler.slots.scheduler
{
    /// <summary>
    /// [tasks.schedule.delete] slot that will delete an existing schedule for a task by its ID.
    /// </summary>
    [Slot(Name = "tasks.schedule.delete")]
    public class ScheduleDelete : ISlotAsync
    {
        readonly ITaskScheduler _scheduler;

        /// <summary>
        /// Creates a new instance of your slot.
        /// </summary>
        /// <param name="scheduler">Which background service to use.</param>
        public ScheduleDelete(ITaskScheduler scheduler)
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
            await _scheduler.DeleteScheduleAsync(input.GetEx<int>());
            input.Clear();
            input.Value = null;
        }
    }
}
