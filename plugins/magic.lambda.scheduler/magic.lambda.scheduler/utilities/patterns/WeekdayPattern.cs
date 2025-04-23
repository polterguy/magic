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
    /// When type of pattern, such as e.g. "**.05|15.23.57.11.**",
    /// implying "every month at the 5th and the 15th, at 23:57:11".
    /// </summary>
    public class WeekdayPattern : IRepetitionPattern
    {
        readonly DayOfWeek[] _weekdays;
        readonly int _hour;
        readonly int _minute;
        readonly int _second;

        /// <summary>
        /// Creates a new instance of a weekday type of repetition pattern, which repeats
        /// on each specified weekday, where month can be a wildcard (**) value,
        /// to imply "all months".
        /// </summary>
        /// <param name="weekdays">Which weekdays to execute task.</param>
        /// <param name="hour">At which hour of the day to execute task.</param>
        /// <param name="minute">At which minute during the hour to execute task.</param>
        /// <param name="second">At which second during the minute to execute task.</param>
        public WeekdayPattern(
            IEnumerable<DayOfWeek> weekdays,
            int hour,
            int minute,
            int second)
        {
            _weekdays = weekdays?.ToArray();
            _hour = hour;
            _minute = minute;
            _second = second;
        }

        /// <inheritdoc/>
        public string Value
        {
            get
            {
                var weekdays = _weekdays == null ? "**" : string.Join("|", _weekdays.Select(x => x.ToString()));
                return $"{weekdays}.{_hour.ToString("D2")}.{_minute.ToString("D2")}.{_second.ToString("D2")}";
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
                if (result > DateTime.UtcNow &&
                    (_weekdays == null || _weekdays.Any(x => x == result.DayOfWeek)))
                    return result;
                result = result.AddDays(1);
            }
        }
    }
}
