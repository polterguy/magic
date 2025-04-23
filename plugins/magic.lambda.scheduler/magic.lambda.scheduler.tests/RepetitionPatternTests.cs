/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using Xunit;
using magic.node.extensions;
using magic.lambda.scheduler.utilities;
using magic.lambda.scheduler.contracts;

namespace magic.lambda.scheduler.tests
{
    public class RepetitionPatternTests
    {
        [Fact]
        public void InvalidRepetitionPattern_01()
        {
            Assert.Throws<HyperlambdaException>(() => PatternFactory.Create("01.01.01"));
        }

        [Fact]
        public void InvalidRepetitionPattern_02()
        {
            Assert.Throws<FormatException>(() => PatternFactory.Create("MM.dd.HH.mm.ss"));
        }

        [Fact]
        public void InvalidRepetitionPattern_03()
        {
            Assert.Throws<FormatException>(() => PatternFactory.Create("**.**.**.**.ss"));
        }

        [Fact]
        public void InvalidRepetitionPattern_04()
        {
            Assert.Throws<ArgumentException>(() => PatternFactory.Create("Monday|Wrongday.01.01.01"));
        }

        [Fact]
        public void InvalidRepetitionPattern_05()
        {
            Assert.Throws<HyperlambdaException>(() => PatternFactory.Create("01.**.**.**.**.Monday"));
        }

        [Fact]
        public void InvalidRepetitionPattern_07()
        {
            Assert.Throws<FormatException>(() => PatternFactory.Create("Monday.01.01.**"));
        }

        [Fact]
        public void InvalidRepetitionPattern_08()
        {
            Assert.Throws<HyperlambdaException>(() => PatternFactory.Create("5.years"));
        }

        [Fact]
        public void EveryMondayAtMidnight()
        {
            var pattern = PatternFactory.Create("Monday.00.00.00");
            var next = pattern.Next();
            Assert.True(next >= DateTime.UtcNow);
            Assert.Equal(DayOfWeek.Monday, next.DayOfWeek);
            Assert.Equal(0, next.Hour);
            Assert.Equal(0, next.Minute);
            Assert.Equal(0, next.Second);
        }

        [Fact]
        public void EveryDayInEveryMonth()
        {
            var pattern = PatternFactory.Create("**.**.23.57.10");
            var next = pattern.Next();
            Assert.True(next >= DateTime.UtcNow);
            Assert.True(next <= DateTime.UtcNow.AddDays(1));
            Assert.Equal(23, next.Hour);
            Assert.Equal(57, next.Minute);
            Assert.Equal(10, next.Second);
        }

        [Fact]
        public void EveryDayInWeek()
        {
            var pattern = PatternFactory.Create("**.23.57.10");
            var next = pattern.Next();
            Assert.True(next >= DateTime.UtcNow);
            Assert.True(next <= DateTime.UtcNow.AddDays(1));
            Assert.Equal(23, next.Hour);
            Assert.Equal(57, next.Minute);
            Assert.Equal(10, next.Second);
        }

        [Fact]
        public void WeekdaysPatternToString_01()
        {
            var pattern = PatternFactory.Create("Monday.00.00.00");
            Assert.Equal("Monday.00.00.00", pattern.Value);
        }

        [Fact]
        public void WeekdaysPatternToString_02()
        {
            var pattern = PatternFactory.Create("sunday|Monday.23.59.14");
            Assert.Equal("Sunday|Monday.23.59.14", pattern.Value);
        }

        [Fact]
        public void WeekdaysPatternToString_03()
        {
            var pattern = PatternFactory.Create("**.00.00.00");
            Assert.Equal("**.00.00.00", pattern.Value);
        }

        [Fact]
        public void MonthPatternToString_01()
        {
            var pattern = PatternFactory.Create("05.05.00.00.00");
            Assert.Equal("05.05.00.00.00", pattern.Value);
        }

        [Fact]
        public void MonthPatternToString_02()
        {
            var pattern = PatternFactory.Create("**.**.00.00.00");
            Assert.Equal("**.**.00.00.00", pattern.Value);
        }

        [Fact]
        public void EverySaturdayAndSundayAt23_57_01()
        {
            var pattern = PatternFactory.Create("Saturday|Sunday.23.57.01");
            var next = pattern.Next();
            Assert.True(next >= DateTime.UtcNow);
            Assert.True(next.DayOfWeek == DayOfWeek.Saturday || next.DayOfWeek == DayOfWeek.Sunday);
            Assert.Equal(23, next.Hour);
            Assert.Equal(57, next.Minute);
            Assert.Equal(1, next.Second);
        }

        [Fact]
        public void Every5thOfMonth()
        {
            var pattern = PatternFactory.Create("**.05.23.57.01");
            var next = pattern.Next();
            Assert.True(next >= DateTime.UtcNow);
            Assert.Equal(5, next.Day);
            Assert.Equal(23, next.Hour);
            Assert.Equal(57, next.Minute);
            Assert.Equal(1, next.Second);
        }

        [Fact]
        public void Every5thAnd15thOfMonth()
        {
            var pattern = PatternFactory.Create("**.05|15.23.59.59");
            var next = pattern.Next();
            Assert.True(next >= DateTime.UtcNow);
            if (DateTime.UtcNow.Day >= 5 && DateTime.UtcNow.Day <= 16)
                Assert.Equal(15, next.Day);
            else
                Assert.Equal(5, next.Day);
            Assert.Equal(23, next.Hour);
            Assert.Equal(59, next.Minute);
            Assert.Equal(59, next.Second);
        }

        [Fact]
        public void EveryJanuaryAndJuly()
        {
            var pattern = PatternFactory.Create("01|07.01.00.00.00");
            var next = pattern.Next();
            Assert.True(next >= DateTime.UtcNow);
            if (DateTime.UtcNow.Month >= 1 && DateTime.UtcNow.Month <= 7)
                Assert.True(next.Month == 7 || next.Month == 1);
            else
                Assert.Equal(1, next.Month);
            Assert.Equal(00, next.Hour);
            Assert.Equal(00, next.Minute);
            Assert.Equal(00, next.Second);
        }

        [Fact]
        public void Every5Seconds()
        {
            var pattern = PatternFactory.Create("5.seconds");
            var next = pattern.Next();
            Assert.True(next >= DateTime.UtcNow);
            Assert.True((next - DateTime.UtcNow).TotalSeconds >= 4 && (next - DateTime.UtcNow).TotalSeconds < 6);
        }

        [Fact]
        public void Every5Minutes()
        {
            var pattern = PatternFactory.Create("5.minutes");
            var next = pattern.Next();
            Assert.True(next >= DateTime.UtcNow);
            Assert.True((next - DateTime.UtcNow).TotalMinutes >= 4 && (next - DateTime.UtcNow).TotalMinutes < 6);
        }

        [Fact]
        public void Every5Hours()
        {
            var pattern = PatternFactory.Create("5.hours");
            var next = pattern.Next();
            Assert.True(next >= DateTime.UtcNow);
            Assert.True((next - DateTime.UtcNow).TotalHours >= 4 && (next - DateTime.UtcNow).TotalHours < 6);
        }

        [Fact]
        public void Every5Days()
        {
            var pattern = PatternFactory.Create("5.days");
            var next = pattern.Next();
            Assert.True(next >= DateTime.UtcNow);
            Assert.Equal("5.days", pattern.Value);
            Assert.True((next - DateTime.UtcNow).TotalDays >= 4 && (next - DateTime.UtcNow).TotalDays < 6);
        }

        [Fact]
        public void Every5Weeks()
        {
            var pattern = PatternFactory.Create("5.weeks");
            var next = pattern.Next();
            Assert.True(next >= DateTime.UtcNow);
            Assert.True((next - DateTime.UtcNow).TotalDays / 7 >= 4 && (next - DateTime.UtcNow).TotalDays / 7 < 6);
        }

        [Fact]
        public void Every5Months()
        {
            var pattern = PatternFactory.Create("5.months");
            var next = pattern.Next();
            Assert.True(next >= DateTime.UtcNow);
            Assert.Equal("5.months", pattern.Value);
            Assert.True((next - DateTime.UtcNow).TotalDays / 30 >= 4 && (next - DateTime.UtcNow).TotalDays / 30 < 6);
        }

        private class ExtPattern : IRepetitionPattern
        {
            readonly string _args;
            public string Value => "ext:foo:" + _args;

            public ExtPattern(string args)
            {
                _args = args ?? throw new ArgumentNullException(nameof(args));
            }

            public DateTime Next()
            {
                return new DateTime(2030, 11, 11, 11, 11, 11);
            }
        }

        [Fact]
        public void ExtensionPattern_01()
        {
            PatternFactory.AddExtensionPattern(
                "foo",
                str =>
                {
                    Assert.Equal("howdy-world", str);
                    return new ExtPattern(str);
                });
            var pattern = PatternFactory.Create("ext:foo:howdy-world");
            var next = pattern.Next();
            Assert.Equal(next, new DateTime(2030, 11, 11, 11, 11, 11));
            Assert.Equal("ext:foo:howdy-world", pattern.Value);
        }

        [Fact]
        public void ExtensionPattern_02()
        {
            PatternFactory.AddExtensionPattern(
                "foo",
                str =>
                {
                    Assert.Equal("howdy-world:foo", str);
                    return new ExtPattern(str);
                });
            var pattern = PatternFactory.Create("ext:foo:howdy-world:foo");
            var next = pattern.Next();
            Assert.Equal(next, new DateTime(2030, 11, 11, 11, 11, 11));
            Assert.Equal("ext:foo:howdy-world:foo", pattern.Value);
        }
    }
}
