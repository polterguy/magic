/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Threading.Tasks;
using magic.node;
using magic.signals.contracts;
using magic.lambda.scheduler.contracts;

namespace magic.lambda.scheduler.slots.tasks
{
    /// <summary>
    /// [tasks.execute] slot that will execute the task with the specified ID.
    /// </summary>
    [Slot(
        Name = "tasks.execute",
        Whitelistable = false,
        Description = "Runs a stored task synchronously right now, ignoring its schedule; handy for ad-hoc invocations or testing",
        ValueKind = "task-id",
        ValueDescription = "Task ID to execute",
        ValueOrChildrenRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.None)]
    public class ExecuteTask : ISlotAsync
    {
        readonly ITaskStorage _storage;

        /// <summary>
        /// Creates a new instance of your slot.
        /// </summary>
        /// <param name="storage">Storage to use for tasks.</param>
        public ExecuteTask(ITaskStorage storage)
        {
            _storage = storage;
        }

        /// <summary>
        /// Slot implementation.
        /// </summary>
        /// <param name="signaler">Signaler that raised signal.</param>
        /// <param name="input">Arguments to slot.</param>
        /// <returns>Awaitable task.</returns>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            await _storage.ExecuteTaskAsync(CreateTask.GetID(input));
            input.Clear();
            input.Value = null;
        }
    }
}
