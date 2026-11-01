/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using Xunit;
using magic.node.extensions;

namespace magic.lambda.dates.tests
{
    public class ExtraDateTests
    {
        [Fact]
        public void FromUnixTreatsValueAsSeconds()
        {
            var lambda = Common.Evaluate("date.from-unix:long:86400");
            Assert.Equal(new DateTime(1970, 1, 2, 0, 0, 0, DateTimeKind.Utc), lambda.Children.First().Value);
        }

        [Fact]
        public void FromUnixOfZeroIsTheEpoch()
        {
            var lambda = Common.Evaluate("date.from-unix:long:0");
            Assert.Equal(DateTime.UnixEpoch, lambda.Children.First().Value);
        }

        [Fact]
        public void UnixIsCurrentTimeInMilliseconds()
        {
            var before = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            var lambda = Common.Evaluate("date.unix");
            var after = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            Assert.InRange((long)lambda.Children.First().Value, before, after);
        }

        [Fact]
        public void TimeFormatFormatsTimeSpan()
        {
            var lambda = Common.Evaluate("time.format:time:900000000\n   format:c");
            Assert.Equal("00:01:30", lambda.Children.First().Value);
            Assert.Empty(lambda.Children.First().Children);
        }

        [Fact]
        public void TimeFormatWithoutFormatThrows()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate("time.format:time:900000000"));
        }

        [Fact]
        public void TimeTotalMilliseconds()
        {
            var lambda = Common.Evaluate("time.total-milliseconds:time:900000000");
            Assert.Equal(90000.0, lambda.Children.First().Value);
        }

        [Fact]
        public void TimeTotalMillisecondsOfBuiltTime()
        {
            var lambda = Common.Evaluate("time\n   minutes:int:1\n   seconds:int:30\n   milliseconds:int:500");
            var time = lambda.Children.First().Value;
            Assert.Equal(TimeSpan.FromMilliseconds(90500), time);
        }
    }
}
