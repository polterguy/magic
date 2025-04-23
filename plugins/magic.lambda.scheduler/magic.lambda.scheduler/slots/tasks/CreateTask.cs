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

namespace magic.lambda.scheduler.slots.tasks
{
    /// <summary>
    /// [tasks.create] slot that will create a new task.
    /// </summary>
    [Slot(Name = "tasks.create")]
    public class CreateTask : ISlotAsync
    {
        readonly ITaskStorage _storage;

        /// <summary>
        /// Creates a new instance of your slot.
        /// </summary>
        /// <param name="storage">Storage to use for tasks.</param>
        public CreateTask(ITaskStorage storage)
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
            await _storage.CreateTaskAsync(Create(signaler, input));
            input.Clear();
            input.Value = null;
        }

        #region [ -- Internal helper methods -- ]

        /*
         * Creates a task from the specified node structure and returns the created task to caller.
         */
        internal static MagicTask Create(ISignaler signaler, Node node)
        {
            // Retrieving and sanity checking ID of task.
            var id = GetID(node);

            // Sanity checking invocation.
            if (!node.Children.Any(x => x.Name == ".lambda"))
                throw new HyperlambdaException($"[{node.Name}] invoked without a [.lambda] object");

            // Retrieving Hyperlambda for task.
            var hlNode = new Node();
            hlNode.AddRange(node.Children.FirstOrDefault(x => x.Name == ".lambda").Clone().Children);
            signaler.Signal("lambda2hyper", hlNode);
            var hyperlambda = hlNode.Get<string>();

            // Retrieving description for task.
            var description = node.Children.FirstOrDefault(x => x.Name == "description")?.GetEx<string>();

            // Creating any optionally supplied schedules, and returning newly created task to caller.
            return new MagicTask(
                id,
                description,
                hyperlambda,
                node.Children.Where(x => x.Name == "repeats" || x.Name == "due").Select(x =>
                {
                    switch (x.Name)
                    {
                        case "due":
                            return new Schedule(x.GetEx<DateTime>());

                        case "repeats":
                            var pattern = PatternFactory.Create(x.GetEx<string>());
                            return new Schedule(pattern.Next(), pattern.Value);

                        default:
                            throw new HyperlambdaException("You're not supposed to be here!");
                    }
                }));
        }

        /*
         * Returns an ID for a task given the specified node.
         */
        internal static string GetID(Node node)
        {
            /*
             * Retrieving ID of task, prioritising [id] argument, resorting to value if no [id] is found,
             * and throwing an exception if neitehr is found.
             */
            var id = node.Children.FirstOrDefault(x => x.Name == "id")?.GetEx<string>() ??
                node.GetEx<string>() ??
                throw new HyperlambdaException($"No [id] or value provided to [{node.Name}]");

            // Sanity checking ID.
            if (id.Any(x => "abcdefghijklmnopqrstuvwxyz0123456789.-_".IndexOf(x) == -1))
                throw new HyperlambdaException("ID of task can only contain [a-z], [0-9] and '.', '-' or '_' characters");

            // Returning ID to caller.
            return id;
        }

        #endregion
    }
}
