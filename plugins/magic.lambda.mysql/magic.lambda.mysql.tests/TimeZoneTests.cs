/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using MySqlConnector;
using Xunit;
using magic.lambda.mysql.helpers;

namespace magic.lambda.mysql.tests
{
    public class TimeZoneTests
    {
        [Fact]
        public void DateTimeParametersAreConvertedToLocalTime()
        {
            var utc = new DateTime(2024, 1, 2, 3, 4, 5, DateTimeKind.Utc);
            using var cmd = new MySqlCommand();
            var parameter = cmd.Parameters.Add("@when", MySqlDbType.DateTime);
            parameter.Value = utc;

            MySqlConnectionWrapper.EnsureLocalTimeZone(cmd);

            var converted = (DateTime)parameter.Value;
            Assert.Equal(DateTimeKind.Local, converted.Kind);
            Assert.Equal(utc.ToLocalTime(), converted);
        }

        [Fact]
        public void OtherParametersAreLeftAlone()
        {
            using var cmd = new MySqlCommand();
            cmd.Parameters.AddWithValue("@name", "john");
            cmd.Parameters.AddWithValue("@age", 42);

            MySqlConnectionWrapper.EnsureLocalTimeZone(cmd);

            Assert.Equal("john", cmd.Parameters["@name"].Value);
            Assert.Equal(42, cmd.Parameters["@age"].Value);
        }

        [Fact]
        public void CommandWithoutParametersIsFine()
        {
            using var cmd = new MySqlCommand();
            MySqlConnectionWrapper.EnsureLocalTimeZone(cmd);
            Assert.Empty(cmd.Parameters);
        }

        [Fact]
        public void DisposingAWrapperThatNeverConnectedIsFine()
        {
            new MySqlConnectionWrapper("Server=127.0.0.1;Port=1;Database=x;User Id=a;Password=b").Dispose();
        }
    }
}
