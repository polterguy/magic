/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Threading.Tasks;

namespace magic.lambda.scheduler.contracts
{
    /// <summary>
    /// Interface for task scheduler, allowing you to schedule tasks, and/or delete existing schedules.
    /// </summary>
    public interface ITaskScheduler
    {
        /// <summary>
        /// Schedules an existing task.
        /// </summary>
        /// <param name="taskId">Actual task you want to schedule.</param>
        /// <param name="repetition">Repetition pattern for schedule.</param>
        Task<int> ScheduleTaskAsync(string taskId, IRepetitionPattern repetition);

        /// <summary>
        /// Schedules an existing task.
        /// </summary>
        /// <param name="taskId">Actual task you want to schedule.</param>
        /// <param name="due">Date and time for when task should be scheduled for execution.</param>
        Task<int> ScheduleTaskAsync(string taskId, DateTime due);

        /// <summary>
        /// Deletes an existing schedule for a task.
        /// </summary>
        /// <param name="id">Unique ID of schedule.</param>
        Task DeleteScheduleAsync(int id);

        /// <summary>
        /// Starts scheduler.
        /// </summary>
        Task StartAsync();
    }
}
