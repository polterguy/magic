/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Numerics;
using System.Text;
using Xunit;
using magic.node.extensions;

namespace magic.node.tests
{
    /*
     * The corners of the JSON conversion; number formats, dates in every notation, escaping, duplicate names and
     * what the reader accepts. In the collection that does not run in parallel, since some of these depend on the
     * static default time zone.
     */
    [Collection(nameof(ConversionTests))]
    public class NodeJsonEdgeTests
    {
        static readonly string[] AB = { "a", "b" };

        static Node Parse(string json)
        {
            var node = new Node();
            NodeJson.FromJson(node, json);
            return node;
        }

        static string Json(object value)
        {
            var node = new Node();
            node.Add(new Node("v", value));
            return NodeJson.ToJson(node);
        }

        #region [ -- Writing numbers -- ]

        [Theory]
        [InlineData(1.0, "{\"v\":1.0}")]
        [InlineData(1.5, "{\"v\":1.5}")]
        [InlineData(1e20, "{\"v\":1E+20}")]
        [InlineData(double.NaN, "{\"v\":\"NaN\"}")]
        [InlineData(double.PositiveInfinity, "{\"v\":\"Infinity\"}")]
        [InlineData(double.NegativeInfinity, "{\"v\":\"-Infinity\"}")]
        public void Doubles(double value, string expected)
        {
            Assert.Equal(expected, Json(value));
        }

        [Theory]
        [InlineData(2f, "{\"v\":2.0}")]
        [InlineData(2.5f, "{\"v\":2.5}")]
        [InlineData(float.NaN, "{\"v\":\"NaN\"}")]
        [InlineData(float.PositiveInfinity, "{\"v\":\"Infinity\"}")]
        public void Floats(float value, string expected)
        {
            Assert.Equal(expected, Json(value));
        }

        [Fact]
        public void Decimals()
        {
            Assert.Equal("{\"v\":5.0}", Json(5m));
            Assert.Equal("{\"v\":1.25}", Json(1.25m));
        }

        #endregion

        #region [ -- Writing dates -- ]

        [Fact]
        public void UtcDate()
        {
            Assert.Equal("{\"v\":\"2020-01-02T03:04:05Z\"}", Json(new DateTime(2020, 1, 2, 3, 4, 5, DateTimeKind.Utc)));
        }

        [Fact]
        public void UnspecifiedDateHasNoSuffix()
        {
            Assert.Equal("{\"v\":\"2020-01-02T03:04:05\"}", Json(new DateTime(2020, 1, 2, 3, 4, 5, DateTimeKind.Unspecified)));
        }

        [Theory]
        [InlineData(1230000, ".123")]
        [InlineData(1234567, ".1234567")]
        [InlineData(100000, ".01")]
        public void FractionsOfASecondAreAsShortAsPossible(int ticks, string fraction)
        {
            var date = new DateTime(2020, 1, 2, 3, 4, 5, DateTimeKind.Utc).AddTicks(ticks);
            Assert.Equal("{\"v\":\"2020-01-02T03:04:05" + fraction + "Z\"}", Json(date));
        }

        [Fact]
        public void LocalDateCarriesItsOffset()
        {
            var json = Json(new DateTime(2020, 1, 2, 3, 4, 5, DateTimeKind.Local));
            Assert.Matches("^\\{\"v\":\"2020-01-02T03:04:05[+-]\\d\\d:\\d\\d\"\\}$", json);
        }

        [Theory]
        [InlineData(2, 0, "+02:00")]
        [InlineData(-5, -30, "-05:30")]
        [InlineData(0, 0, "+00:00")]
        public void DatesWithOffsets(int hours, int minutes, string suffix)
        {
            var value = new DateTimeOffset(2020, 1, 2, 3, 4, 5, new TimeSpan(hours, minutes, 0));
            Assert.Equal("{\"v\":\"2020-01-02T03:04:05" + suffix + "\"}", Json(value));
        }

        #endregion

        #region [ -- Writing strings -- ]

        [Fact]
        public void StringsAreOnlyEscapedWhereTheyMustBe()
        {
            Assert.Equal("{\"v\":\"tab\\tnew\\nline\\rform\\fback\\bslash\\\\quote\\\"\"}", Json("tab\tnew\nline\rform\fback\bslash\\quote\""));
            Assert.Equal("{\"v\":\"\\u0001\\u0085\\u2028\\u2029ok\"}", Json("\u0001\u0085\u2028\u2029ok"));
            Assert.Equal("{\"v\":\"plain æøå ü\"}", Json("plain æøå ü"));
        }

        #endregion

        #region [ -- Reading dates -- ]

        [Fact]
        public void DateWithoutZone()
        {
            var value = (DateTime)Parse("{\"v\":\"2020-01-02T03:04:05\"}").Children.First().Value;
            Assert.Equal(new DateTime(2020, 1, 2, 3, 4, 5), value);
            Assert.Equal(DateTimeKind.Unspecified, value.Kind);
        }

        [Fact]
        public void DateWithZ()
        {
            var value = (DateTime)Parse("{\"v\":\"2020-01-02T03:04:05Z\"}").Children.First().Value;
            Assert.Equal(DateTimeKind.Utc, value.Kind);
            Assert.Equal(new DateTime(2020, 1, 2, 3, 4, 5, DateTimeKind.Utc), value);
        }

        [Theory]
        [InlineData("+02:00", 1, 4)]
        [InlineData("+0200", 1, 4)]
        [InlineData("+02", 1, 4)]
        [InlineData("-05:30", 8, 34)]
        [InlineData("-0530", 8, 34)]
        public void DateWithOffsetIsConvertedToLocalTime(string offset, int utcHour, int utcMinute)
        {
            var value = (DateTime)Parse("{\"v\":\"2020-01-02T03:04:05" + offset + "\"}").Children.First().Value;
            Assert.Equal(DateTimeKind.Local, value.Kind);
            Assert.Equal(new DateTime(2020, 1, 2, utcHour, utcMinute, 5, DateTimeKind.Utc), value.ToUniversalTime());
        }

        [Theory]
        [InlineData(".1", 1000000)]
        [InlineData(".123", 1230000)]
        [InlineData(".1234567", 1234567)]
        public void FractionsOfASecond(string fraction, int ticks)
        {
            var value = (DateTime)Parse("{\"v\":\"2020-01-02T03:04:05" + fraction + "\"}").Children.First().Value;
            Assert.Equal(new DateTime(2020, 1, 2, 3, 4, 5).AddTicks(ticks), value);
        }

        [Fact]
        public void HourTwentyFourIsMidnightAtTheEndOfTheDay()
        {
            var value = (DateTime)Parse("{\"v\":\"2020-01-02T24:00:00\"}").Children.First().Value;
            Assert.Equal(new DateTime(2020, 1, 3), value);
        }

        [Theory]
        [InlineData("2020-13-02T03:04:05")]          // Month.
        [InlineData("2020-02-30T03:04:05")]          // Day.
        [InlineData("2020-01-02T25:04:05")]          // Hour.
        [InlineData("2020-01-02T24:00:01")]          // Hour 24 only means midnight.
        [InlineData("2020-01-02T03:60:05")]          // Minute.
        [InlineData("2020-01-02T03:04:60")]          // Second.
        [InlineData("2020-01-02T03:04:05.")]         // Fraction without digits.
        [InlineData("2020-01-02T03:04:05.12345678")] // Too many digits.
        [InlineData("2020-01-02T03:04:05+25:00")]    // Offset hour.
        [InlineData("2020-01-02T03:04:05+02:60")]    // Offset minute.
        [InlineData("2020-01-02T03:04:05+0")]        // Truncated offset.
        [InlineData("2020-01-02T03:04:05Zjunk")]     // Garbage after Z.
        [InlineData("2020/01/02T03:04:05")]          // Separators.
        [InlineData("0000-01-02T03:04:05")]          // Year.
        [InlineData("2020-01-02 03:04:05")]          // Not a T.
        public void StringsThatAreNotDatesStayStrings(string text)
        {
            Assert.Equal(text, Parse("{\"v\":\"" + text + "\"}").Children.First().Value);
        }

        [Theory]
        [InlineData("utc", DateTimeKind.Utc)]
        [InlineData("local", DateTimeKind.Local)]
        [InlineData("none", DateTimeKind.Unspecified)]
        public void DefaultTimeZoneDecidesTheKindOfDatesWithoutOne(string zone, DateTimeKind expected)
        {
            try
            {
                Converter.DefaultTimeZone = zone;
                var value = (DateTime)Parse("{\"v\":\"2020-01-02T03:04:05\"}").Children.First().Value;
                Assert.Equal(expected, value.Kind);
            }
            finally
            {
                Converter.DefaultTimeZone = "none";
            }
        }

        [Fact]
        public void DefaultTimeZoneIsAlsoAppliedWhenWritingDatesWithoutAKind()
        {
            try
            {
                var node = new Node();
                node.Add(new Node("v", new DateTime(2020, 1, 2, 3, 4, 5, DateTimeKind.Unspecified)));
                Converter.DefaultTimeZone = "utc";
                Assert.Equal("{\"v\":\"2020-01-02T03:04:05Z\"}", NodeJson.ToJson(node));
                Converter.DefaultTimeZone = "local";
                Assert.Matches("[+-]\\d\\d:\\d\\d\"\\}$", NodeJson.ToJson(node));
            }
            finally
            {
                Converter.DefaultTimeZone = "none";
            }
        }

        #endregion

        #region [ -- Reading numbers and objects -- ]

        [Fact]
        public void IntegersAreLongsAndHugeOnesAreBigIntegers()
        {
            var node = Parse("{\"small\":7,\"minus\":-1,\"big\":5000,\"huge\":9223372036854775808,\"neg\":-9223372036854775809,\"real\":1.5,\"exp\":1e3}");
            var values = node.Children.ToDictionary(x => x.Name, x => x.Value);
            Assert.Equal(7L, values["small"]);
            Assert.Equal(-1L, values["minus"]);
            Assert.Equal(5000L, values["big"]);
            Assert.Equal(BigInteger.Parse("9223372036854775808"), values["huge"]);
            Assert.Equal(BigInteger.Parse("-9223372036854775809"), values["neg"]);
            Assert.Equal(1.5, values["real"]);
            Assert.Equal(1000.0, values["exp"]);
        }

        [Fact]
        public void LastValueOfADuplicateNameWinsAndKeepsTheFirstPosition()
        {
            var node = Parse("{\"a\":1,\"b\":2,\"a\":3}");
            Assert.Equal(AB, node.Children.Select(x => x.Name).ToArray());
            Assert.Equal(3L, node.Children.First().Value);
        }

        [Fact]
        public void DuplicateNamesInALargeObject()
        {
            var json = "{" + string.Join(",", Enumerable.Range(1, 12).Select(x => $"\"p{x}\":{x}")) + ",\"p3\":\"replaced\",\"p12\":\"also\"}";
            var node = Parse(json);
            Assert.Equal(12, node.Children.Count());
            Assert.Equal("replaced", node.Children.First(x => x.Name == "p3").Value);
            Assert.Equal("also", node.Children.First(x => x.Name == "p12").Value);
        }

        [Fact]
        public void ManyDistinctNamesAreFine()
        {
            var json = "{" + string.Join(",", Enumerable.Range(0, 700).Select(x => $"\"name{x}\":{x}")) + "}";
            Assert.Equal(700, Parse(json).Children.Count());
            Assert.Equal(700, Parse(json).Children.Count());
        }

        [Fact]
        public void EscapedAndLongNames()
        {
            var longName = new string('x', 100);
            var node = Parse("{\"a\\nb\":1,\"" + longName + "\":2,\"\\u00e6\":3}");
            Assert.Equal(new[] { "a\nb", longName, "æ" }, node.Children.Select(x => x.Name).ToArray());
        }

        [Fact]
        public void NestedStructures()
        {
            var node = Parse("{\"list\":[1,[2,3],{\"k\":null}],\"flag\":true,\"off\":false}");
            var list = node.Children.First(x => x.Name == "list");
            Assert.Equal(3, list.Children.Count());
            Assert.Equal(2, list.Children.Skip(1).First().Children.Count());
            Assert.Null(list.Children.Last().Children.First().Value);
            Assert.True((bool)node.Children.First(x => x.Name == "flag").Value);
            Assert.False((bool)node.Children.First(x => x.Name == "off").Value);
        }

        [Fact]
        public void SimpleValueDocumentCreatesNoChildren()
        {
            Assert.Empty(Parse("5").Children);
            Assert.Empty(Parse("\"text\"").Children);
        }

        #endregion

        #region [ -- The reader -- ]

        static ReadOnlySpan<byte> Bytes(string text, bool bom = false) =>
            (bom ? new byte[] { 0xEF, 0xBB, 0xBF } : []).Concat(Encoding.UTF8.GetBytes(text)).ToArray();

        [Fact]
        public void ByteOrderMarkIsSkippedByDefault()
        {
            var node = new Node();
            NodeJson.FromUtf8(node, Bytes("{\"a\":1}", true), true);
            Assert.Single(node.Children);
        }

        [Fact]
        public void ByteOrderMarkCanBeLeftInPlaceAndThenFails()
        {
            var node = new Node();
            Assert.Throws<HyperlambdaException>(() => NodeJson.FromUtf8(node, Bytes("{\"a\":1}", true), true, skipBom: false));
        }

        [Fact]
        public void TrailingTextIsRejectedWhenAskedTo()
        {
            Assert.Throws<HyperlambdaException>(() => NodeJson.FromUtf8(new Node(), Bytes("{} x"), true));
            NodeJson.FromUtf8(new Node(), Bytes("{} "), true);
        }

        [Fact]
        public void EmptyAndBrokenDocumentsFail()
        {
            Assert.Throws<HyperlambdaException>(() => NodeJson.FromJson(new Node(), ""));
            Assert.Throws<HyperlambdaException>(() => NodeJson.FromJson(new Node(), "{\"a\":"));
            Assert.Throws<HyperlambdaException>(() => NodeJson.FromJson(new Node(), null));
        }

        [Fact]
        public void CommentsAndTrailingCommasOnlyInNonStrictMode()
        {
            const string json = "{\"a\":1, /* a comment */ \"b\":[1,2,],}";
            var node = new Node();
            NodeJson.FromUtf8(node, Bytes(json), true);
            Assert.Equal(2, node.Children.Count());
            Assert.Throws<HyperlambdaException>(() => NodeJson.FromUtf8(new Node(), Bytes(json), true, strict: true));
        }

        [Fact]
        public void LargeDocumentsAreParsedToo()
        {
            var json = "[" + string.Join(",", Enumerable.Range(0, 400).Select(x => $"\"item number {x}\"")) + "]";
            Assert.Equal(400, Parse(json).Children.Count());
        }

        #endregion

        #region [ -- Objects -- ]

        [Fact]
        public void ParseObjectGivesDictionariesAndLists()
        {
            var result = NodeJson.ParseObject("{\"a\":1,\"b\":{\"c\":[1,\"x\"]}}");
            Assert.Equal(1L, result["a"]);
            var inner = (System.Collections.Generic.Dictionary<string, object>)result["b"];
            Assert.Equal(2, ((System.Collections.Generic.List<object>)inner["c"]).Count);
        }

        [Fact]
        public void ParseObjectRejectsWhatIsNotAnObject()
        {
            Assert.Throws<HyperlambdaException>(() => NodeJson.ParseObject("[1,2]"));
        }

        [Fact]
        public void ReformatIsParsedToTheSameThing()
        {
            var reformatted = NodeJson.Reformat("{ \"a\" : [ 1 , 2 ] , \"b\" : \"x\" }");
            Assert.Equal("{\"a\":[1,2],\"b\":\"x\"}", reformatted.Replace(" ", "").Replace("\r", "").Replace("\n", ""));
        }

        [Fact]
        public void EmptyNodeIsAnEmptyObject()
        {
            Assert.IsType<System.Collections.Generic.Dictionary<string, object>>(NodeJson.ToObject(new Node()));
        }

        #endregion
    }
}
