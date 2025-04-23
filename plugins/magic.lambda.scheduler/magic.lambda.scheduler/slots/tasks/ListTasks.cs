/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Threading.Tasks;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.lambda.scheduler.contracts;

namespace magic.lambda.scheduler.slots.tasks
{
    /// <summary>
    /// [tasks.list] slot that will return the names of all tasks in the system.
    /// </summary>
    [Slot(Name = "tasks.list")]
    public class ListTasks : ISlotAsync
    {
        readonly ITaskStorage _storage;

        /// <summary>
        /// Creates a new instance of your slot.
        /// </summary>
        /// <param name="storage">Storage to use for tasks.</param>
        public ListTasks(ITaskStorage storage)
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
            // Creating our filter.
            var filter = input.GetEx<string>();
            if (!filter?.Contains('%') ?? false)
                filter += "%";

            // Retrieving tasks
            var tasks = await _storage.ListTasksAsync(
                filter,
                input.Children.FirstOrDefault(x => x.Name == "offset")?.GetEx<long>() ?? 0,
                input.Children.FirstOrDefault(x => x.Name == "limit")?.GetEx<long>() ?? 10);

            // House cleaning.
            input.Clear();
            input.Value = null;

            // Returning results to caller.
            foreach (var idx in tasks)
            {
                // Building our currently iterated task node structure.
                var cur = new Node(".");
                cur.Add(new Node("id", idx.ID));
                cur.Add(new Node("created", idx.Created));
                if (!string.IsNullOrEmpty(idx.Description))
                    cur.Add(new Node("description", idx.Description));
                input.Add(cur);
            }
        }
    }
}