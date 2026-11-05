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
    /// [tasks.delete] slot that will delete the task withthe specified ID.
    /// </summary>
    [Slot(
        Name = "tasks.delete",
        Description = "Removes a stored task by ID along with any of its scheduled future runs",
        ValueKind = "task-id",
        ValueDescription = "Task ID to delete",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.None)]
    public class DeleteTask : ISlotAsync
    {
        readonly ITaskStorage _storage;

        /// <summary>
        /// Creates a new instance of your slot.
        /// </summary>
        /// <param name="storage">Storage to use for tasks.</param>
        public DeleteTask(ITaskStorage storage)
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
            await _storage.DeleteTaskAsync(CreateTask.GetID(input));
            input.Clear();
            input.Value = null;
        }
    }
}
