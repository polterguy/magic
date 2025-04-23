/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using Xunit;
using magic.node.extensions;
using magic.node.extensions.hyperlambda;

namespace magic.node.tests
{
    /*
     * Unit tests for converting from Hyperlambda string declarations to objects, and vice versa.
     */
    public class ConversionTests
    {
        [Fact]
        public void ConvertBoolTrue()
        {
            Assert.Equal(true, Converter.ToObject(true, "bool"));
        }

        [Fact]
        public void ConvertBoolFalse()
        {
            Assert.Equal(false, Converter.ToObject(false, "bool"));
        }

        [Fact]
        public void ConvertBoolTrue_String()
        {
            Assert.Equal(true, Converter.ToObject("true", "bool"));
        }

        [Fact]
        public void ConvertBoolFalse_String()
        {
            Assert.Equal(false, Converter.ToObject("false", "bool"));
        }

        [Fact]
        public void ConvertFromBoolToString_01()
        {
            var result = Converter.ToString(true);
            Assert.Equal("bool", result.Item1);
            Assert.Equal("true", result.Item2);
        }

        [Fact]
        public void ConvertFromBoolToString_02()
        {
            var result = Converter.ToString(false);
            Assert.Equal("bool", result.Item1);
            Assert.Equal("false", result.Item2);
        }

        [Fact]
        public void ConvertNullToString()
        {
            var result = Converter.ToString(null);
            Assert.Null(result.Item1);
            Assert.Null(result.Item2);
        }

        [Fact]
        public void ConvertNonConvertableObject()
        {
            var result = Converter.ToString(new ConversionTests());
            Assert.Contains(".ConversionTests", result.Item1);
            Assert.Contains(".ConversionTests", result.Item2);
        }

        [Fact]
        public void ConvertStringToString_01()
        {
            var result = Converter.ToString("Howdy World");
            Assert.Equal("string", result.Item1);
            Assert.Equal("Howdy World", result.Item2);
        }

        [Fact]
        public void ConvertStringToObject()
        {
            var result = Converter.ToObject("Howdy World", "string");
            Assert.Equal("Howdy World", result);
        }

        [Fact]
        public void ConvertIntObjectToString()
        {
            var result = Converter.ToObject(11, "string");
            Assert.Equal("11", result);
        }

        [Fact]
        public void ConvertBoolObjectToString_01()
        {
            var result = Converter.ToObject(true, "string");
            Assert.Equal("true", result);
        }

        [Fact]
        public void ConvertBoolObjectToString_02()
        {
            var result = Converter.ToObject(false, "string");
            Assert.Equal("false", result);
        }

        [Fact]
        public void ConvertStringToString_02()
        {
            var result = Converter.ToString("Howdy:World");
            Assert.Equal("string", result.Item1);
            Assert.Equal("Howdy:World", result.Item2);
        }

        [Fact]
        public void ConvertToStringFromInt16()
        {
            var result = Converter.ToString((short)5);
            Assert.Equal("short", result.Item1);
            Assert.Equal("5", result.Item2);
        }

        [Fact]
        public void ConvertToInt16FromString()
        {
            var result = Converter.ToObject("5", "short");
            Assert.Equal((short)5, result);
            Assert.Equal(typeof(short), result.GetType());
        }

        [Fact]
        public void ConvertToStringFromUInt16()
        {
            var result = Converter.ToString((ushort)5);
            Assert.Equal("ushort", result.Item1);
            Assert.Equal("5", result.Item2);
        }

        [Fact]
        public void ConvertToUInt16FromString()
        {
            var result = Converter.ToObject("5", "ushort");
            Assert.Equal((ushort)5, result);
            Assert.Equal(typeof(ushort), result.GetType());
        }

        [Fact]
        public void ConvertToStringFromInt32()
        {
            var result = Converter.ToString(5);
            Assert.Equal("int", result.Item1);
            Assert.Equal("5", result.Item2);
        }

        [Fact]
        public void ConvertToInt32FromString()
        {
            var result = Converter.ToObject("5", "int");
            Assert.Equal(5, result);
            Assert.Equal(typeof(int), result.GetType());
        }

        [Fact]
        public void ConvertToStringFromUInt32()
        {
            var result = Converter.ToString((uint)5);
            Assert.Equal("uint", result.Item1);
            Assert.Equal("5", result.Item2);
        }

        [Fact]
        public void ConvertToUInt32FromString()
        {
            var result = Converter.ToObject("5", "uint");
            Assert.Equal((uint)5, result);
            Assert.Equal(typeof(uint), result.GetType());
        }

        [Fact]
        public void ConvertToStringFromInt64()
        {
            var result = Converter.ToString(5L);
            Assert.Equal("long", result.Item1);
            Assert.Equal("5", result.Item2);
        }

        [Fact]
        public void ConvertToInt64FromString()
        {
            var result = Converter.ToObject("5", "long");
            Assert.Equal((long)5, result);
            Assert.Equal(typeof(long), result.GetType());
        }

        [Fact]
        public void ConvertToStringFromUInt64()
        {
            var result = Converter.ToString((ulong)5);
            Assert.Equal("ulong", result.Item1);
            Assert.Equal("5", result.Item2);
        }

        [Fact]
        public void ConvertToUInt64FromString()
        {
            var result = Converter.ToObject("5", "ulong");
            Assert.Equal((ulong)5, result);
            Assert.Equal(typeof(ulong), result.GetType());
        }

        [Fact]
        public void ConvertToStringFromDecimal()
        {
            var result = Converter.ToString((decimal)5);
            Assert.Equal("decimal", result.Item1);
            Assert.Equal("5", result.Item2);
        }

        [Fact]
        public void ConvertToDecimalFromString()
        {
            var result = Converter.ToObject("5", "decimal");
            Assert.Equal((decimal)5, result);
            Assert.Equal(typeof(decimal), result.GetType());
        }

        [Fact]
        public void ConvertToStringFromDouble()
        {
            var result = Converter.ToString((double)5);
            Assert.Equal("double", result.Item1);
            Assert.Equal("5", result.Item2);
        }

        [Fact]
        public void ConvertToDoubleFromString()
        {
            var result = Converter.ToObject("5", "double");
            Assert.Equal((double)5, result);
            Assert.Equal(typeof(double), result.GetType());
        }

        [Fact]
        public void ConvertToStringFromFloat()
        {
            var result = Converter.ToString((float)5);
            Assert.Equal("float", result.Item1);
            Assert.Equal("5", result.Item2);
        }

        [Fact]
        public void ConvertToFloatFromString_01()
        {
            var result = Converter.ToObject("5", "float");
            Assert.Equal((float)5, result);
            Assert.Equal(typeof(float), result.GetType());
        }

        [Fact]
        public void ConvertToFloatFromString_02()
        {
            var result = Converter.ToObject("5", "single");
            Assert.Equal((float)5, result);
            Assert.Equal(typeof(float), result.GetType());
        }

        [Fact]
        public void ConvertToStringFromGuid()
        {
            var result = Converter.ToString(Guid.Empty);
            Assert.Equal("guid", result.Item1);
            Assert.Equal("00000000-0000-0000-0000-000000000000", result.Item2);
        }

        [Fact]
        public void ConvertToGuidFromString()
        {
            var result = Converter.ToObject("00000000-0000-0000-0000-000000000000", "guid");
            Assert.Equal(new Guid("00000000-0000-0000-0000-000000000000"), result);
            Assert.Equal(typeof(Guid), result.GetType());
        }

        [Fact]
        public void ConvertToGuidFromGuid()
        {
            var result = Converter.ToObject(new Guid("00000000-0000-0000-0000-000000000000"), "guid");
            Assert.Equal(new Guid("00000000-0000-0000-0000-000000000000"), result);
            Assert.Equal(typeof(Guid), result.GetType());
        }

        [Fact]
        public void ConvertToStringFromChar()
        {
            var result = Converter.ToString('q');
            Assert.Equal("char", result.Item1);
            Assert.Equal("q", result.Item2);
        }

        [Fact]
        public void ConvertToCharFromString()
        {
            var result = Converter.ToObject("q", "char");
            Assert.Equal('q', result);
            Assert.Equal(typeof(char), result.GetType());
        }

        [Fact]
        public void ConvertToStringFromByte()
        {
            var result = Converter.ToString((byte)5);
            Assert.Equal("byte", result.Item1);
            Assert.Equal("5", result.Item2);
        }

        [Fact]
        public void ConvertToByteFromString()
        {
            var result = Converter.ToObject("5", "byte");
            Assert.Equal((byte)5, result);
            Assert.Equal(typeof(byte), result.GetType());
        }

        [Fact]
        public void ConvertToStringFromExpression()
        {
            var result = Converter.ToString(new Expression("foo/bar"));
            Assert.Equal("x", result.Item1);
            Assert.Equal("foo/bar", result.Item2);
        }

        [Fact]
        public void ConvertToExpressionFromString()
        {
            var result = Converter.ToObject("foo/bar", "x");
            Assert.Equal(typeof(Expression), result.GetType());
            Assert.Equal("foo/bar", (result as Expression).Value);
        }

        [Fact]
        public void ConvertToExpressionFromExpression()
        {
            var result = Converter.ToObject(new Expression("foo/bar"), "x");
            Assert.Equal(typeof(Expression), result.GetType());
            Assert.Equal("foo/bar", (result as Expression).Value);
        }

        [Fact]
        public void ConvertToStringFromNode()
        {
            var rootNode = new Node();
            var hlNode = new Node("foo");
            hlNode.Add(new Node("howdy1", 5));
            hlNode.Add(new Node("howdy2", 7M));
            rootNode.Add(hlNode);
            var result = Converter.ToString(rootNode);
            Assert.Equal("node", result.Item1);
            Assert.Equal("foo\r\n   howdy1:int:5\r\n   howdy2:decimal:7\r\n", result.Item2);
        }

        [Fact]
        public void ConvertToNodeFromString()
        {
            var result = Converter.ToObject(@"foo
   howdy1:int:5
   howdy2:decimal:7", "node");
            Assert.Equal(typeof(Node), result.GetType());
            var n = result as Node;
            Assert.Equal("foo", n.Children.First().Name);
            Assert.Equal("howdy1", n.Children.First().Children.First().Name);
            Assert.Equal("howdy2", n.Children.First().Children.Skip(1).First().Name);
            Assert.Equal(5, n.Children.First().Children.First().Value);
            Assert.Equal(7M, n.Children.First().Children.Skip(1).First().Value);
        }

        [Fact]
        public void ConvertToNodeFromNode()
        {
            var node = new Node();
            var foo = new Node("foo");
            foo.Add(new Node("howdy1", 5));
            foo.Add(new Node("howdy2", 7M));
            node.Add(foo);
            var result = Converter.ToObject(node, "node");
            Assert.Equal(typeof(Node), result.GetType());
            var n = result as Node;
            Assert.Equal("foo", n.Children.First().Name);
            Assert.Equal("howdy1", n.Children.First().Children.First().Name);
            Assert.Equal("howdy2", n.Children.First().Children.Skip(1).First().Name);
            Assert.Equal(5, n.Children.First().Children.First().Value);
            Assert.Equal(7M, n.Children.First().Children.Skip(1).First().Value);
        }

        /*
         * Helper class, to test injecting custom type into conversion to Hyperlambda value.
         */
        class Foo
        {
            public int Value1 { get; set; }

            public string Value2 { get; set; }
        }

        [Fact]
        public void ConvertToStringFromCustomType()
        {
            Converter.AddConverter(
                typeof(Foo),
                "foo",
                (obj) => {
                    var fooInput = obj as Foo;
                    return ("foo", $"{fooInput.Value1},{fooInput.Value2}");
                }, (obj) => {
                    var strEntities = (obj as string).Split(',');
                    return new Foo
                    {
                        Value1 = int.Parse(strEntities[0]),
                        Value2 = strEntities[1],
                    };
                });
            var foo = new Foo
            {
                Value1 = 5,
                Value2 = "Howdy World",
            };
            var result = Converter.ToString(foo);
            Assert.Equal("foo", result.Item1);
            Assert.Equal("5,Howdy World", result.Item2);
        }

        [Fact]
        public void ConvertToCustomTypeFromString()
        {
            Converter.AddConverter(
                typeof(Foo),
                "foo",
                (obj) => {
                    var fooInput = obj as Foo;
                    return ("foo", $"{fooInput.Value1},{fooInput.Value2}");
                }, (obj) => {
                    var strEntities = (obj as string).Split(',');
                    return new Foo
                    {
                        Value1 = int.Parse(strEntities[0]),
                        Value2 = strEntities[1],
                    };
                });
            var result = Converter.ToObject("5,Howdy World", "foo") as Foo;
            Assert.Equal(5, result.Value1);
            Assert.Equal("Howdy World", result.Value2);
        }

        [Fact]
        public void CreateHyperlambdaWithCustomType()
        {
            Converter.AddConverter(
                typeof(Foo),
                "foo",
                (obj) => {
                    var fooInput = obj as Foo;
                    return ("foo", $"{fooInput.Value1},{fooInput.Value2}");
                }, (obj) => {
                    var strEntities = (obj as string).Split(',');
                    return new Foo
                    {
                        Value1 = int.Parse(strEntities[0]),
                        Value2 = strEntities[1],
                    };
                });
            var node = new Node();
            node.Add(new Node("some-value", 5));
            node.Add(new Node("foo", new Foo {
                Value1 = 5,
                Value2 = "Howdy World",
            }));
            node.Add(new Node("some-other-value", 5M));
            var hyperlambda = HyperlambdaGenerator.GetHyperlambda(node.Children);
            Assert.Equal("some-value:int:5\r\nfoo:foo:5,Howdy World\r\nsome-other-value:decimal:5\r\n", hyperlambda);
        }

        [Fact]
        public void CreateHyperlambdaWithCustomType_WithDoubleQuotes()
        {
            Converter.AddConverter(
                typeof(Foo),
                "foo",
                (obj) => {
                    var fooInput = obj as Foo;
                    return ("foo", $"{fooInput.Value1},{fooInput.Value2}");
                }, (obj) => {
                    var strEntities = (obj as string).Split(',');
                    return new Foo
                    {
                        Value1 = int.Parse(strEntities[0]),
                        Value2 = strEntities[1],
                    };
                });
            var node = new Node();
            node.Add(new Node("some-value", 5));
            node.Add(new Node("foo", new Foo
            {
                Value1 = 5,
                Value2 = "Howdy \"World",
            }));
            node.Add(new Node("some-other-value", 5M));
            var hyperlambda = HyperlambdaGenerator.GetHyperlambda(node.Children);
            Assert.Equal("some-value:int:5\r\nfoo:foo:" + "\"5,Howdy \\\"World\"" + "\r\nsome-other-value:decimal:5\r\n", hyperlambda);
        }

        [Fact]
        public void ListSupportedTypes()
        {
            var types = Converter.GetTypes();
            Assert.True(types.Count() >= 20);
            Assert.NotNull(types.FirstOrDefault(x => x == "bytes"));
            Assert.NotNull(types.FirstOrDefault(x => x == "short"));
            Assert.NotNull(types.FirstOrDefault(x => x == "ushort"));
            Assert.NotNull(types.FirstOrDefault(x => x == "int"));
            Assert.NotNull(types.FirstOrDefault(x => x == "uint"));
            Assert.NotNull(types.FirstOrDefault(x => x == "long"));
            Assert.NotNull(types.FirstOrDefault(x => x == "ulong"));
            Assert.NotNull(types.FirstOrDefault(x => x == "decimal"));
            Assert.NotNull(types.FirstOrDefault(x => x == "double"));
            Assert.NotNull(types.FirstOrDefault(x => x == "single"));
            Assert.NotNull(types.FirstOrDefault(x => x == "float"));
            Assert.NotNull(types.FirstOrDefault(x => x == "char"));
            Assert.NotNull(types.FirstOrDefault(x => x == "byte"));
            Assert.NotNull(types.FirstOrDefault(x => x == "string"));
            Assert.NotNull(types.FirstOrDefault(x => x == "bool"));
            Assert.NotNull(types.FirstOrDefault(x => x == "date"));
            Assert.NotNull(types.FirstOrDefault(x => x == "time"));
            Assert.NotNull(types.FirstOrDefault(x => x == "guid"));
            Assert.NotNull(types.FirstOrDefault(x => x == "x"));
            Assert.NotNull(types.FirstOrDefault(x => x == "node"));
        }

        [Fact]
        public void ConvertToBytes()
        {
            var result = Converter.ToString(new byte[] {(byte)'x', (byte)'y'});
            Assert.Equal("bytes", result.Item1);
            Assert.Equal("eHk=", result.Item2);
            var bytes = Converter.ToObject(result.Item2, "bytes") as byte[];
            Assert.NotNull(bytes);
            Assert.Equal(2, bytes.Length);
            Assert.Equal((byte)'x', bytes[0]);
            Assert.Equal((byte)'y', bytes[1]);
        }

        [Fact]
        public void ConvertTo_Throws()
        {
            var result = Converter.ToString(new byte[] {(byte)'x', (byte)'y'});
            Assert.Equal("bytes", result.Item1);
            Assert.Equal("eHk=", result.Item2);
            Assert.Throws<HyperlambdaException>(() => Converter.ToObject(result.Item2, "NON-EXISTING"));
        }
    }
}
