/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using magic.node.extensions;
using magic.lambda.scheduler.contracts;

namespace magic.lambda.scheduler.utilities.patterns
{
    /// <summary>
    /// Interval repetition pattern, such as for instance "5.seconds", "5.months", etc.
    /// </summary>
    public class IntervalPattern : IRepetitionPattern
    {
        readonly string _entity;
        readonly int _interval;

        /// <summary>
        /// Constructs a new instance of an interval repetition pattern.
        /// </summary>
        /// <param name="interval">How many units of the entity to allow to pass inbetween task executions.</param>
        /// <param name="entity">Entity, "seconds", "minutes", "hours", "days", "weeks", or "months".</param>
        public IntervalPattern(int interval, string entity)
        {
            // Sanity checking invocation.
            switch(entity)
            {
                case "seconds":
                case "minutes":
                case "hours":
                case "days":
                case "weeks":
                case "months":
                    break;
                default:
                    throw new HyperlambdaException("You can only use seconds, minutes, hours, days, weeks and months in an interval type of repetition pattern.");
            }
            _entity = entity;
            _interval = interval;
        }

        /// <inheritdoc/>
        public string Value => $"{_interval}.{_entity}";

        /// <inheritdoc/>
        public DateTime Next()
        {
            switch (_entity)
            {
                case "seconds":
                    return DateTime.UtcNow.AddSeconds(_interval);
                case "minutes":
                    return DateTime.UtcNow.AddMinutes(_interval);
                case "hours":
                    return DateTime.UtcNow.AddHours(_interval);
                case "days":
                    return DateTime.UtcNow.AddDays(_interval);
                case "weeks":
                    return DateTime.UtcNow.AddDays(_interval * 7);
                case "months":
                    return DateTime.UtcNow.AddMonths(_interval);
            }
            throw new ArgumentException("You cannot possibly have reached this code!");
        }
    }
}
