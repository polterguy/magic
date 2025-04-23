/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;

namespace magic.lambda.scheduler.contracts
{
    /// <summary>
    /// Common interface for repetition patterns.
    /// </summary>
    public interface IRepetitionPattern
    {
        /// <summary>
        /// Calculates the next date and time for when the task is to be executed and returns
        /// as a UTC date and time.
        /// </summary>
        /// <returns>UTC date and time when task should be executed.</returns>
        DateTime Next();

        /// <summary>
        /// Returns the string representation of the repetition pattern.
        /// 
        /// This is the pattern we persist as the repetition pattern for the task when a task is persisted.
        /// </summary>
        /// <value>String representation for repetition pattern.</value>
        string Value { get; }
    }
}
