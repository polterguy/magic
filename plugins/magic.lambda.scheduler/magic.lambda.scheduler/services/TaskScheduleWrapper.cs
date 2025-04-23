/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Threading;
using magic.lambda.scheduler.contracts;

namespace magic.lambda.scheduler.services.internals
{
    /*
     * Helper POCO class kind of to encapsulate a single schedule for
     * a task in the future some time.
     */
    sealed internal class TaskScheduleWrapper : IDisposable
    {
        public TaskScheduleWrapper(
            Timer timer,
            string taskId,
            int scheduleId, 
            IRepetitionPattern repetition)
        {
            Timer = timer;
            TaskId = taskId;
            ScheduleId = scheduleId;
            Repetition = repetition;
        }

        public Timer Timer { get; private set; }
        public string TaskId { get; private set; }
        public int ScheduleId { get; private set; }
        public IRepetitionPattern Repetition { get; set; }

        public void Dispose()
        {
            Timer.Dispose();
        }
    }
}