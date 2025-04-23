/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Collections.Generic;
using magic.lambda.scheduler.contracts;

namespace magic.lambda.scheduler.utilities.patterns
{
    /// <summary>
    /// Month type of pattern, such as e.g. "**.05|15.23.57.11",
    /// implying "every month at the 5th and the 15th, at 23:57:11".
    /// </summary>
    public class MonthPattern : IRepetitionPattern
    {
        readonly int[] _months;
        readonly int[] _days;
        readonly int _hour;
        readonly int _minute;
        readonly int _second;

        /// <summary>
        /// Creates a new instance of a month type of repetition pattern, which repeats
        /// on each specified day of each specified month, where month can be a wildcard (**) value,
        /// to imply "all months".
        /// </summary>
        /// <param name="months">Which months to execute task, can be null.</param>
        /// <param name="days">Which days in the month to execute task, can be null, but must be given if months are given.</param>
        /// <param name="hour">At which hour of the day to execute task.</param>
        /// <param name="minute">At which minute during the hour to execute task.</param>
        /// <param name="second">At which second during the minute to execute task.</param>
        public MonthPattern(
            IEnumerable<int> months,
            IEnumerable<int> days,
            int hour,
            int minute,
            int second)
        {
            _months = months?.ToArray();
            _days = days?.ToArray();
            _hour = hour;
            _minute = minute;
            _second = second;
        }

        /// <inheritdoc/>
        public string Value
        {
            get
            {
                var months = _months == null ? "**" : string.Join("|", _months.Select(x => x.ToString("D2")));
                var days = _days == null ? "**" : string.Join("|", _days.Select(x => x.ToString("D2")));
                return $"{months}.{days}.{_hour.ToString("D2")}.{_minute.ToString("D2")}.{_second.ToString("D2")}";
            }
        }

        /// <inheritdoc/>
        public DateTime Next()
        {
            var utcNow = DateTime.UtcNow;
            var result = new DateTime(
                utcNow.Year,
                utcNow.Month,
                utcNow.Day,
                _hour,
                _minute,
                _second);
            while (true)
            {
                if (result > utcNow &&
                    (_months == null || _months.Any(x => result.Month == x)) &&
                    (_days == null || _days.Any(x => result.Day == x)))
                    return result;
                result = result.AddDays(1);
            }
        }
    }
}
