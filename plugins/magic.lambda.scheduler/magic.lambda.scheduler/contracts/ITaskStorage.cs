/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Threading.Tasks;
using System.Collections.Generic;

namespace magic.lambda.scheduler.contracts
{
    /// <summary>
    /// Interface for task storage, allowing you to create, read, update, and delete tasks.
    /// </summary>
    public interface ITaskStorage
    {
        /// <summary>
        /// Creates a new task, either a simple persisted non-due task, or a repeating or due task.
        /// </summary>
        /// <param name="task">Task to create.</param>
        Task CreateTaskAsync(MagicTask task);

        /// <summary>
        /// Lists all tasks in system paged.
        /// </summary>
        /// <param name="filter">String tasks needs to start with in their ID to be considered a match.</param>
        /// <param name="offset">Offset of where to return tasks from.</param>
        /// <param name="limit">Maximum number of tasks to return.</param>
        /// <returns>List of tasks.</returns>
        Task<IList<MagicTask>> ListTasksAsync(string filter, long offset, long limit);

        /// <summary>
        /// Returns the specified task, and its associated due date(s).
        /// </summary>
        /// <param name="id">ID of task to retrieve.</param>
        /// <param name="schedules">If true will also retrieve schedules for task.</param>
        /// <returns>Returns task if found, otherwise throws exception.</returns>
        Task<MagicTask> GetTaskAsync(string id, bool schedules = false);

        /// <summary>
        /// Counts tasks in system matching the optional query.
        /// </summary>
        /// <param name="filter">String tasks needs to start with in their ID to be considered a match.</param>
        /// <returns>Number of tasks in system matching optional query.</returns>
        Task<int> CountTasksAsync(string filter);

        /// <summary>
        /// Updates an existing task.
        /// </summary>
        /// <param name="task">Node declaration of task.</param>
        Task UpdateTaskAsync(MagicTask task);

        /// <summary>
        /// Deletes the task with the specified ID.
        /// </summary>
        /// <param name="id">Unique ID of task to delete.</param>
        Task DeleteTaskAsync(string id);

        /// <summary>
        /// Executes the task with the specified ID.
        /// </summary>
        /// <param name="id">ID of task to execute.</param>
        Task ExecuteTaskAsync(string id);
    }
}
