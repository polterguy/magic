/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.dates
{
    /// <summary>
    /// [time] slot, allowing you to construct a new TimeSpan.
    /// </summary>
    [Slot(Name = "time")]
    public class Time : ISlot
    {
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var days = input.Children.FirstOrDefault(x => x.Name == "days")?.GetEx<int>() ?? 0;
            var hours = input.Children.FirstOrDefault(x => x.Name == "hours")?.GetEx<int>() ?? 0;
            var minutes = input.Children.FirstOrDefault(x => x.Name == "minutes")?.GetEx<int>() ?? 0;
            var seconds = input.Children.FirstOrDefault(x => x.Name == "seconds")?.GetEx<int>() ?? 0;
            var milliseconds = input.Children.FirstOrDefault(x => x.Name == "milliseconds")?.GetEx<int>() ?? 0;
            input.Value = new TimeSpan(days, hours, minutes, seconds, milliseconds);
        }
    }
}
