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
    /// [tasks.get] slot that will return an existing task with the specified name,
    /// including its next due date.
    /// </summary>
    [Slot(Name = "tasks.get")]
    public class GetTask : ISlotAsync
    {
        readonly ITaskStorage _storage;

        /// <summary>
        /// Creates a new instance of your slot.
        /// </summary>
        /// <param name="storage">Storage to use for tasks.</param>
        public GetTask(ITaskStorage storage)
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
            // Retrieving ID and sanity checking invocation.
            var id = input.GetEx<string>() ?? 
                throw new HyperlambdaException("No ID provided to [tasks.get]");

            // Retrieving task from storage and returning results to caller.
            var task = await _storage.GetTaskAsync(
                id,
                input.Children.FirstOrDefault(x => x.Name == "schedules")?.GetEx<bool>() ?? false);
            CreateResult(task, input);
        }

        #region [ -- Private helper methods -- ]

        /*
         * Adds the properties for the task into the specified node.
         */
        static void CreateResult(MagicTask task, Node input)
        {
            // House cleaning.
            input.Value = null;
            input.Clear();

            // Making sure we found specified task.
            if (task == null)
                return;

            // Returning task properties to caller.
            input.Add(new Node("hyperlambda", task.Hyperlambda.Trim()));
            input.Add(new Node("created", task.Created));
            if (!string.IsNullOrEmpty(task.Description))
                input.Add(new Node("description", task.Description));

            // Returning schedules for task.
            if (task.Schedules.Any())
            {
                var scheduleNode = new Node("schedules");
                foreach (var idx in task.Schedules)
                {
                    var idxNode = new Node(".");
                    idxNode.Add(new Node("id", idx.Id));
                    idxNode.Add(new Node("due", idx.Due));
                    if (!string.IsNullOrEmpty(idx.Repeats))
                        idxNode.Add(new Node("repeats", idx.Repeats));
                    scheduleNode.Add(idxNode);
                }
                input.Add(scheduleNode);
            }
        }

        #endregion
    }
}
