/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Collections.Generic;
using System.Linq;
using System.Numerics;
using System.Text;
using Xunit;
using magic.node.extensions;

namespace magic.node.tests
{
    public class NodeJsonTests
    {
        enum Colour { Red = 1, Green = 2 }

        static Node Parse(string json)
        {
            var node = new Node();
            NodeJson.FromJson(node, json);
            return node;
        }

        #region [ -- Lambda to JSON -- ]

        [Fact]
        public void NamedChildrenBecomeAnObject()
        {
            var node = new Node();
            node.Add(new Node("name", "Thomas"));
            node.Add(new Node("age", 44L));
            node.Add(new Node("active", true));
            node.Add(new Node("nothing", null));
            node.Add(new Node("ratio", 1.5));
            Assert.Equal(
                "{\"name\":\"Thomas\",\"age\":44,\"active\":true,\"nothing\":null,\"ratio\":1.5}",
                NodeJson.ToJson(node));
        }

        [Fact]
        public void UnnamedChildrenBecomeAnArray()
        {
            var node = new Node();
            node.Add(new Node(".", 1L));
            node.Add(new Node(".", "two"));
            node.Add(new Node("", 3L));
            Assert.Equal("[1,\"two\",3]", NodeJson.ToJson(node));
        }

        [Fact]
        public void NoChildrenBecomesAnEmptyObject()
        {
            Assert.Equal("{}", NodeJson.ToJson(new Node()));
        }

        [Fact]
        public void NestedContainers()
        {
            var node = Parse("{\"a\":{\"b\":[1,2,{\"c\":null}]},\"d\":[]}");
            Assert.Equal("{\"a\":{\"b\":[1,2,{\"c\":null}]},\"d\":null}", NodeJson.ToJson(node));
        }

        [Fact]
        public void IndentedUsesTwoSpaces()
        {
            var node = new Node();
            node.Add(new Node("a", 1L));
            var json = NodeJson.ToJson(node, true);
            Assert.Contains("\n", json);
            Assert.Contains("  \"a\": 1", json);
        }

        [Fact]
        public void Utf8IsTheSameAsTheString()
        {
            var node = Parse("{\"a\":\"æøå\",\"b\":[1,2]}");
            Assert.Equal(Encoding.UTF8.GetBytes(NodeJson.ToJson(node)), NodeJson.ToUtf8(node));
        }

        [Fact]
        public void DuplicateNamesThrow()
        {
            var node = new Node();
            node.Add(new Node("a", 1L));
            node.Add(new Node("a", 2L));
            Assert.Throws<ArgumentException>(() => NodeJson.ToJson(node));
        }

        [Fact]
        public void DuplicateNamesThrowInLargeObjects()
        {
            var node = new Node();
            for (var idx = 0; idx < 20; idx++)
            {
                node.Add(new Node("n" + idx, (long)idx));
            }
            node.Add(new Node("n3", 0L));
            Assert.Throws<ArgumentException>(() => NodeJson.ToJson(node));
        }

        [Fact]
        public void LargeObjectsWithoutDuplicatesWork()
        {
            var node = new Node();
            for (var idx = 0; idx < 20; idx++)
            {
                node.Add(new Node("n" + idx, (long)idx));
            }
            Assert.StartsWith("{\"n0\":0,\"n1\":1", NodeJson.ToJson(node));
        }

        [Theory]
        [MemberData(nameof(Values))]
        public void EveryValueTypeIsWritten(object value, string expected)
        {
            var node = new Node();
            node.Add(new Node("v", value));
            Assert.Equal("{\"v\":" + expected + "}", NodeJson.ToJson(node));
        }

        public static IEnumerable<object[]> Values()
        {
            yield return new object[] { (int)5, "5" };
            yield return new object[] { (short)-5, "-5" };
            yield return new object[] { (sbyte)-1, "-1" };
            yield return new object[] { (byte)200, "200" };
            yield return new object[] { (ushort)65535, "65535" };
            yield return new object[] { (uint)4000000000, "4000000000" };
            yield return new object[] { ulong.MaxValue, "18446744073709551615" };
            yield return new object[] { BigInteger.Pow(10, 30), "1000000000000000000000000000000" };
            yield return new object[] { 1.5f, "1.5" };
            yield return new object[] { 2.25m, "2.25" };
            yield return new object[] { Colour.Green, "2" };
            yield return new object[] { false, "false" };
            yield return new object[] { DBNull.Value, "null" };
            yield return new object[] { new byte[] { 1, 2, 3 }, "\"AQID\"" };
            yield return new object[] { Guid.Parse("11111111-2222-3333-4444-555555555555"), "\"11111111-2222-3333-4444-555555555555\"" };
            yield return new object[] { new Uri("https://ainiro.io/x"), "\"https://ainiro.io/x\"" };
            yield return new object[] { new TimeSpan(1, 2, 3), "\"01:02:03\"" };
            yield return new object[] { "quote \" and \\ and \n", "\"quote \\\" and \\\\ and \\n\"" };
        }

        [Fact]
        public void DatesAreWrittenAsIso()
        {
            var node = new Node();
            node.Add(new Node("d", new DateTime(2024, 5, 6, 7, 8, 9, DateTimeKind.Utc)));
            node.Add(new Node("o", new DateTimeOffset(2024, 5, 6, 7, 8, 9, TimeSpan.Zero)));
            var json = NodeJson.ToJson(node);
            Assert.Contains("2024-05-06T07:08:09", json);
            Assert.Equal(2, json.Split("2024-05-06T07:08:09").Length - 1);
        }

        [Fact]
        public void UnsupportedValueThrows()
        {
            var node = new Node();
            node.Add(new Node("v", new object()));
            Assert.Throws<ArgumentException>(() => NodeJson.ToJson(node));
        }

        #endregion

        #region [ -- Lambda to simple objects -- ]

        [Fact]
        public void ToObjectCreatesDictionaryListAndValues()
        {
            var node = Parse("{\"a\":1,\"b\":[1,\"x\",{\"c\":true}],\"d\":null}");
            var obj = Assert.IsType<Dictionary<string, object>>(NodeJson.ToObject(node));
            Assert.Equal(1L, obj["a"]);
            Assert.Null(obj["d"]);
            var list = Assert.IsType<List<object>>(obj["b"]);
            Assert.Equal(3, list.Count);
            Assert.Equal("x", list[1]);
            Assert.True((bool)((Dictionary<string, object>)list[2])["c"]);
        }

        [Fact]
        public void ToObjectOfArrayIsAList()
        {
            var list = Assert.IsType<List<object>>(NodeJson.ToObject(Parse("[1,2]")));
            Assert.Equal(new object[] { 1L, 2L }, list.ToArray());
        }

        [Fact]
        public void ToObjectOfNothingIsAnEmptyDictionary()
        {
            Assert.Empty(Assert.IsType<Dictionary<string, object>>(NodeJson.ToObject(new Node())));
        }

        [Fact]
        public void ToObjectRejectsDuplicatesAndUnsupportedValues()
        {
            var dup = new Node();
            dup.Add(new Node("a", 1L));
            dup.Add(new Node("a", 2L));
            Assert.Throws<ArgumentException>(() => NodeJson.ToObject(dup));
            var bad = new Node();
            bad.Add(new Node("a", new object()));
            Assert.Throws<ArgumentException>(() => NodeJson.ToObject(bad));
        }

        #endregion

        #region [ -- JSON to lambda -- ]

        [Fact]
        public void ObjectBecomesNamedChildren()
        {
            var node = Parse("{\"a\":1,\"b\":\"x\",\"c\":{\"d\":true},\"e\":[null,2]}");
            Assert.Equal(new[] { "a", "b", "c", "e" }, node.Children.Select(x => x.Name).ToArray());
            Assert.Equal(1L, node.Children.First().Value);
            Assert.Equal("x", node.Children.Skip(1).First().Value);
            Assert.Equal(true, node.Children.Skip(2).First().Children.First().Value);
            var array = node.Children.Last();
            Assert.Equal(new[] { ".", "." }, array.Children.Select(x => x.Name).ToArray());
            Assert.Null(array.Children.First().Value);
            Assert.Equal(2L, array.Children.Last().Value);
        }

        [Fact]
        public void NumbersKeepTheirKind()
        {
            var node = Parse("[-1,0,1024,1025,9007199254740993,1.5,1e3,-2.5E-2,123456789012345678901234567890]");
            var values = node.Children.Select(x => x.Value).ToArray();
            Assert.Equal(-1L, values[0]);
            Assert.Equal(0L, values[1]);
            Assert.Equal(1024L, values[2]);
            Assert.Equal(1025L, values[3]);
            Assert.Equal(9007199254740993L, values[4]);
            Assert.Equal(1.5, values[5]);
            Assert.Equal(1000.0, values[6]);
            Assert.Equal(-0.025, values[7]);
            Assert.Equal(BigInteger.Parse("123456789012345678901234567890"), values[8]);
        }

        [Fact]
        public void IsoStringsBecomeDates()
        {
            var node = Parse("{\"a\":\"2024-05-06T07:08:09Z\",\"b\":\"2024-05-06T07:08:09.123Z\",\"c\":\"2024-05-06\",\"d\":\"not a date at all\",\"e\":\"2024-13-06T07:08:09Z\"}");
            var a = Assert.IsType<DateTime>(node.Children.First().Value);
            Assert.Equal(DateTimeKind.Utc, a.Kind);
            Assert.Equal(new DateTime(2024, 5, 6, 7, 8, 9, DateTimeKind.Utc), a);
            var b = Assert.IsType<DateTime>(node.Children.Skip(1).First().Value);
            Assert.Equal(123, b.Millisecond);
            Assert.Equal("2024-05-06", node.Children.Skip(2).First().Value);
            Assert.Equal("not a date at all", node.Children.Skip(3).First().Value);
            Assert.Equal("2024-13-06T07:08:09Z", node.Children.Skip(4).First().Value);
        }

        [Fact]
        public void DatesWithOffsetAreAccepted()
        {
            var node = Parse("[\"2024-05-06T07:08:09+02:00\",\"2024-05-06T07:08:09-05:30\"]");
            Assert.All(node.Children, x => Assert.IsType<DateTime>(x.Value));
        }

        [Fact]
        public void SimpleValueCreatesNoChildren()
        {
            Assert.Empty(Parse("\"abc\"").Children);
            Assert.Empty(Parse("42").Children);
        }

        [Fact]
        public void NullJsonThrows()
        {
            Assert.Throws<HyperlambdaException>(() => NodeJson.FromJson(new Node(), null));
        }

        [Theory]
        [InlineData("")]
        [InlineData("   ")]
        [InlineData("{")]
        [InlineData("{\"a\":}")]
        [InlineData("[1,2")]
        [InlineData("{} {}")]
        [InlineData("[] x")]
        public void InvalidJsonThrows(string json)
        {
            Assert.Throws<HyperlambdaException>(() => NodeJson.FromJson(new Node(), json));
        }

        [Fact]
        public void CommentsAndTrailingCommasAreAllowedByDefault()
        {
            var node = Parse("{ /* c */ \"a\": 1, // line\n \"b\": [1,2,], }");
            Assert.Equal(2, node.Children.Count());
        }

        [Fact]
        public void StrictRejectsCommentsAndTrailingCommas()
        {
            Assert.Throws<HyperlambdaException>(() =>
                NodeJson.FromUtf8(new Node(), Encoding.UTF8.GetBytes("{\"a\":1 /* c */}"), true, true, true));
            Assert.Throws<HyperlambdaException>(() =>
                NodeJson.FromUtf8(new Node(), Encoding.UTF8.GetBytes("[1,2,]"), true, true, true));
        }

        [Fact]
        public void TrailingTextIsOnlyRejectedWhenAskedTo()
        {
            var bytes = Encoding.UTF8.GetBytes("{\"a\":1} garbage");
            Assert.Throws<HyperlambdaException>(() => NodeJson.FromUtf8(new Node(), bytes, true));
            var node = new Node();
            NodeJson.FromUtf8(node, Encoding.UTF8.GetBytes("{\"a\":1}"), false);
            Assert.Single(node.Children);
        }

        [Fact]
        public void ByteOrderMarkIsSkippedWhenAskedTo()
        {
            var bytes = new byte[] { 0xEF, 0xBB, 0xBF }.Concat(Encoding.UTF8.GetBytes("{\"a\":1}")).ToArray();
            var node = new Node();
            NodeJson.FromUtf8(node, bytes, true);
            Assert.Single(node.Children);
            Assert.Throws<HyperlambdaException>(() => NodeJson.FromUtf8(new Node(), bytes, true, false));
        }

        [Fact]
        public void LargeDocumentsAreParsed()
        {
            var json = "[" + string.Join(",", Enumerable.Range(0, 400).Select(x => "\"item-" + x + "\"")) + "]";
            var node = Parse(json);
            Assert.Equal(400, node.Children.Count());
            Assert.Equal("item-399", node.Children.Last().Value);
        }

        [Fact]
        public void RoundTripKeepsTheDocument()
        {
            var json = "{\"a\":[1,2.5,\"x\",null,true],\"b\":{\"c\":{\"d\":[]}}}";
            Assert.Equal("{\"a\":[1,2.5,\"x\",null,true],\"b\":{\"c\":{\"d\":null}}}", NodeJson.ToJson(Parse(json)));
        }

        #endregion

        #region [ -- Simple objects and reformatting -- ]

        [Fact]
        public void ParseObjectCreatesNestedStructures()
        {
            var obj = NodeJson.ParseObject("{\"a\":1,\"b\":[1,{\"c\":\"x\"}],\"d\":{\"e\":null},\"f\":1.5,\"g\":false}");
            Assert.Equal(1L, obj["a"]);
            Assert.Equal(1.5, obj["f"]);
            Assert.Equal(false, obj["g"]);
            Assert.Null(((Dictionary<string, object>)obj["d"])["e"]);
            var list = (List<object>)obj["b"];
            Assert.Equal("x", ((Dictionary<string, object>)list[1])["c"]);
        }

        [Theory]
        [InlineData("[1,2]")]
        [InlineData("42")]
        [InlineData("{\"a\":1} x")]
        [InlineData("{\"a\":")]
        public void ParseObjectRejectsEverythingButOneObject(string json)
        {
            Assert.Throws<HyperlambdaException>(() => NodeJson.ParseObject(json));
        }

        [Fact]
        public void ParseObjectAndReformatRejectNull()
        {
            Assert.Throws<HyperlambdaException>(() => NodeJson.ParseObject(null));
            Assert.Throws<HyperlambdaException>(() => NodeJson.Reformat(null));
        }

        [Fact]
        public void ReformatIndents()
        {
            var json = NodeJson.Reformat("{\"a\":[1,2],\"b\":{\"c\":\"x\"},\"d\":null,\"e\":true,\"f\":1.5}");
            Assert.Contains("\n", json);
            Assert.Contains("  \"a\": [", json);
            Assert.Equal(
                NodeJson.ParseObject(json).Keys.ToArray(),
                new[] { "a", "b", "d", "e", "f" });
        }

        [Fact]
        public void ReformatRejectsInvalidJson()
        {
            Assert.Throws<HyperlambdaException>(() => NodeJson.Reformat("[1]"));
        }

        #endregion
    }
}
