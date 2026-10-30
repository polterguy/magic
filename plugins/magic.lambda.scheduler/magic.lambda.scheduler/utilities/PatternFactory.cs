/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Collections.Generic;
using magic.node.extensions;
using magic.lambda.scheduler.contracts;
using magic.lambda.scheduler.utilities.patterns;

namespace magic.lambda.scheduler.utilities
{
    /// <summary>
    /// Class encapsulating a repetition pattern, helping you to find the next DateTime
    /// to execute a task, according to a given pattern.
    /// </summary>
    public static class PatternFactory
    {
        readonly static Dictionary<string, Func<string, IRepetitionPattern>> _createExtensions =
            new Dictionary<string, Func<string, IRepetitionPattern>>();

        /// <summary>
        /// Creates a new instance of the class.
        /// </summary>
        /// <param name="pattern">Repetition pattern to use.</param>
        /// <returns>An instance of an IRepetitionPattern.</returns>
        public static IRepetitionPattern Create(string pattern)
        {
            // Checking if this is an extension pattern.
            if (pattern.StartsWith("ext:", StringComparison.Ordinal))
            {
                var tmp = pattern.Split(':');
                return _createExtensions[tmp[1]](string.Join(":", tmp.Skip(2)));
            }

            // Defaulting to the built in patterns.
            var entities = pattern.Split('.');
            switch(entities.Length)
            {
                case 2:
                    return new IntervalPattern(int.Parse(entities[0]), entities[1]);

                case 4:
                    var weekdays = entities[0] == "**" ?
                        null :
                        entities[0].Split('|')
                            .Select(x => Enum.Parse<DayOfWeek>(x, true));
                    return new WeekdayPattern(
                        weekdays,
                        Parse(entities[1], 0, 23),
                        Parse(entities[2], 0, 59),
                        Parse(entities[3], 0, 59));

                case 5:
                    var months = entities[0] == "**" ? null : entities[0].Split('|').Select(x => Parse(x, 1, 12));
                    var days = entities[1] == "**" ? null : entities[1].Split('|').Select(x => Parse(x, 1, 31));
                    return new MonthPattern(
                        months,
                        days,
                        Parse(entities[2], 0, 23),
                        Parse(entities[3], 0, 59),
                        Parse(entities[4], 0, 59));

                default:
                    throw new HyperlambdaException($"'{pattern}' is not a recognized repetition pattern.");
            }
        }

        /*
         * Parses a numeric pattern part, making sure the result is within the
         * given range, to avoid impossible dates and endless loops when the
         * pattern is used to find the next execution date.
         */
        static int Parse(string value, int min, int max)
        {
            var result = int.Parse(value);
            if (result < min || result > max)
                throw new HyperlambdaException($"'{value}' is not a valid repetition pattern part, expected a value between {min} and {max}");
            return result;
        }

        /// <summary>
        /// Adds an extension pattern to the pattern resolver, allowing you to reference
        /// your extension by prefixing your pattern with "ext:" and then its key,
        /// followed by the value for your extension patter. For instance "ext:foo:57",
        /// implying 57 being the parameter given to your extension pattern.
        /// </summary>
        /// <param name="key">Lookup key to resolve your extension pattern.</param>
        /// <param name="functor">Function responsible for creating your IPattern instance.</param>
        public static void AddExtensionPattern(string key, Func<string, IRepetitionPattern> functor)
        {
            _createExtensions[key] = functor;
        }
    }
}
