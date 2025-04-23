/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Globalization;
using Xunit;
using magic.node.extensions;

namespace magic.lambda.dates.tests
{
    public class DateTests
    {
        [Fact]
        public void Now()
        {
            var lambda = Common.Evaluate(@"
date.now");
            Assert.Equal(typeof(DateTime), lambda.Children.First().Value.GetType());
        }

        [Fact]
        public void Min()
        {
            var lambda = Common.Evaluate(@"
date.min");
            Assert.Equal(DateTime.MinValue, lambda.Children.First().Value);
        }

        [Fact]
        public void Max()
        {
            var lambda = Common.Evaluate(@"
date.max");
            Assert.Equal(DateTime.MaxValue, lambda.Children.First().Value);
        }

        [Fact]
        public void Format()
        {
            var lambda = Common.Evaluate(@"
date.now
date.format:x:-
   format:""MM:yyyy:ddTHH:mm:ss""
");
            Assert.Equal(
                lambda.Children.First().GetEx<DateTime>()
                    .ToString("MM:yyyy:ddTHH:mm:ss", CultureInfo.InvariantCulture),
                lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void FormatThrows()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
date.now
date.format:x:-
"));
        }

        [Fact]
        public void AddTime_01()
        {
            var lambda = Common.Evaluate(@"
date.now
math.add
   get-value:x:@date.now
   time
      hours:1");
            Assert.Equal(
                lambda.Children.First().GetEx<DateTime>().AddHours(1),
                lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void AddTime_02()
        {
            var lambda = Common.Evaluate(@"
date.now
math.add
   get-value:x:@date.now
   time
      days:1
      hours:1
      minutes:1
      seconds:1
      milliseconds:1");
            Assert.Equal(
                lambda.Children.First().GetEx<DateTime>()
                    .AddDays(1)
                    .AddHours(1)
                    .AddMinutes(1)
                    .AddSeconds(1)
                    .AddMilliseconds(1),
                lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void AddTime_03()
        {
            var lambda = Common.Evaluate(@"
date.now
math.add
   get-value:x:@date.now
   time
      minutes:1");
            Assert.Equal(
                lambda.Children.First().GetEx<DateTime>().AddMinutes(1),
                lambda.Children.Skip(1).First().Value);
        }
    }
}
