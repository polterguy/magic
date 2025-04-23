/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Globalization;
using Xunit;
using magic.node.extensions;

namespace magic.node.tests
{
    /*
     * Unit tests for converting from Hyperlambda string declarations to objects, and vice versa.
     */
    [CollectionDefinition(nameof(ConversionTests), DisableParallelization = true)]
    public class DateConversionTests
    {
        [Fact]
        public void ConvertToStringFromUTCDateTime()
        {
            var result = Converter.ToString(new DateTime(2020, 12, 23, 23, 59, 11, DateTimeKind.Utc));
            Assert.Equal("date", result.Item1);
            Assert.Equal("2020-12-23T23:59:11.000Z", result.Item2);
        }

        [Fact]
        public void ConvertToStringFromLocaleDateTime()
        {
            var result = Converter.ToString(new DateTime(2020, 12, 23, 23, 59, 11, DateTimeKind.Local));
            Assert.Equal("date", result.Item1);
            Assert.Equal("2020-12-23T23:59:11.000+" + TimeZoneInfo.Local.BaseUtcOffset, result.Item2 + ":00");
        }

        [Fact]
        public void ConvertToStringFromUnspecifiedDateTime()
        {
            var result = Converter.ToString(new DateTime(2020, 12, 23, 23, 59, 11, DateTimeKind.Unspecified));
            Assert.Equal("date", result.Item1);
            Assert.Equal("2020-12-23T23:59:11.000", result.Item2);
        }

        [Fact]
        public void ConvertToStringFromUnspecifiedDateTimeDefaultToUTC()
        {
            Converter.DefaultTimeZone = "utc";
            var result = Converter.ToString(new DateTime(2020, 12, 23, 23, 59, 11, DateTimeKind.Unspecified));
            Converter.DefaultTimeZone = "none";
            Assert.Equal("date", result.Item1);
            Assert.Equal("2020-12-23T23:59:11.000Z", result.Item2);
        }

        [Fact]
        public void ConvertToStringFromUnspecifiedDateTimeDefaultToLocale()
        {
            Converter.DefaultTimeZone = "local";
            var result = Converter.ToString(new DateTime(2020, 12, 23, 23, 59, 11, DateTimeKind.Unspecified));
            Converter.DefaultTimeZone = "none";
            Assert.Equal("date", result.Item1);
            Assert.Equal("2020-12-23T23:59:11.000+" + TimeZoneInfo.Local.BaseUtcOffset, result.Item2 + ":00");
        }

        [Fact]
        public void ConvertToDateTimeFromStringUnspecified()
        {
            var result = Converter.ToObject("2020-12-23T23:59:11", "date");
            Assert.Equal(typeof(DateTime), result.GetType());
            var date = (DateTime)result;
            Assert.Equal(DateTimeKind.Unspecified, date.Kind);
            Assert.Equal(2020, date.Year);
            Assert.Equal(12, date.Month);
            Assert.Equal(23, date.Day);
            Assert.Equal(23, date.Hour);
            Assert.Equal(59, date.Minute);
            Assert.Equal(11, date.Second);
            Assert.Equal(0, date.Millisecond);
        }

        [Fact]
        public void ConvertToDateTimeFromStringUTC()
        {
            var result = Converter.ToObject("2020-12-23T23:59Z", "date");
            Assert.Equal(typeof(DateTime), result.GetType());
            var date = (DateTime)result;
            Assert.Equal(DateTimeKind.Utc, date.Kind);
            Assert.Equal(2020, date.Year);
            Assert.Equal(12, date.Month);
            Assert.Equal(23, date.Day);
            Assert.Equal(23, date.Hour);
            Assert.Equal(59, date.Minute);
            Assert.Equal(0, date.Second);
            Assert.Equal(0, date.Millisecond);
        }

        [Fact]
        public void ConvertToDateTimeFromStringLocal()
        {
            var result = Converter.ToObject("2020-12-23T23:59:00.001+" + TimeZoneInfo.Local.BaseUtcOffset.ToString().Substring(0,5), "date");
            Assert.Equal(typeof(DateTime), result.GetType());
            var date = (DateTime)result;
            Assert.Equal(DateTimeKind.Local, date.Kind);
            Assert.Equal(2020, date.Year);
            Assert.Equal(12, date.Month);
            Assert.Equal(23, date.Day);
            Assert.Equal(23, date.Hour);
            Assert.Equal(59, date.Minute);
            Assert.Equal(0, date.Second);
            Assert.Equal(1, date.Millisecond);
        }

        [Fact]
        public void ConvertToDateTimeFromStringUnspecifiedDefaultUTC()
        {
            Converter.DefaultTimeZone = "utc";
            var result = Converter.ToObject("2020-12-23T23:59:11", "date");
            Converter.DefaultTimeZone = "none";
            Assert.Equal(typeof(DateTime), result.GetType());
            var date = (DateTime)result;
            Assert.Equal(DateTimeKind.Utc, date.Kind);
            Assert.Equal(2020, date.Year);
            Assert.Equal(12, date.Month);
            Assert.Equal(23, date.Day);
            Assert.Equal(23, date.Hour);
            Assert.Equal(59, date.Minute);
            Assert.Equal(11, date.Second);
            Assert.Equal(0, date.Millisecond);
        }

        [Fact]
        public void ConvertToDateTimeFromStringUnspecifiedDefaultLocal()
        {
            Converter.DefaultTimeZone = "local";
            var result = Converter.ToObject("2020-12-23T23:59:11", "date");
            Converter.DefaultTimeZone = "none";
            Assert.Equal(typeof(DateTime), result.GetType());
            var date = (DateTime)result;
            Assert.Equal(DateTimeKind.Local, date.Kind);
            Assert.Equal(2020, date.Year);
            Assert.Equal(12, date.Month);
            Assert.Equal(23, date.Day);
            Assert.Equal(23, date.Hour);
            Assert.Equal(59, date.Minute);
            Assert.Equal(11, date.Second);
            Assert.Equal(0, date.Millisecond);
        }

        [Fact]
        public void ConvertToStringFromTimeSpan()
        {
            var result = Converter.ToString(new TimeSpan(2000));
            Assert.Equal("time", result.Item1);
            Assert.Equal("2000", result.Item2);
        }

        [Fact]
        public void ConvertToTimeSpanFromString()
        {
            var result = Converter.ToObject("2000", "time");
            Assert.Equal(new TimeSpan(2000), result);
            Assert.Equal(typeof(TimeSpan), result.GetType());
        }

        [Fact]
        public void ConvertToTimeSpanFromTime()
        {
            var result = Converter.ToObject(new TimeSpan(2000), "time");
            Assert.Equal(new TimeSpan(2000), result);
            Assert.Equal(typeof(TimeSpan), result.GetType());
        }
    }
}
