/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using Xunit;
using magic.data.common.helpers;

namespace magic.data.common.tests.tests
{
    public class ConverterTests
    {
        [Fact]
        public void ConvertDBNull()
        {
            var val = Converter.GetValue(DBNull.Value);
            Assert.Null(val);
        }

        [Fact]
        public void ConvertNull()
        {
            var val = Converter.GetValue(null);
            Assert.Null(val);
        }

        [Fact]
        public void ConvertNotNull()
        {
            var val = Converter.GetValue("howdy");
            Assert.Equal("howdy", val);
        }
    }
}
