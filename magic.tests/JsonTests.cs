/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System.Linq;
using Xunit;
using magic.node;
using magic.tests.lambda;

namespace magic.tests
{
    public class JsonTests
    {
        [Fact]
        public void FromJsonSimpleObject()
        {
            var signaler = Common.GetSignaler();
            var node = new Node("", @"{""foo"":5}");
            signaler.Signal("from-json", node);
            Assert.Equal("foo", node.Children.First().Name);
            Assert.Equal(5L, node.Children.First().Value);
        }

        [Fact]
        public void FromJsonMultipleProperties()
        {
            var signaler = Common.GetSignaler();
            var node = new Node("", @"{""foo"":5, ""bar"": ""howdy""}");
            signaler.Signal("from-json", node);
            Assert.Equal("foo", node.Children.First().Name);
            Assert.Equal(5L, node.Children.First().Value);
            Assert.Equal("bar", node.Children.Skip(1).First().Name);
            Assert.Equal("howdy", node.Children.Skip(1).First().Value);
        }

        [Fact]
        public void FromJsonArrayOfIntegers()
        {
            var signaler = Common.GetSignaler();
            var node = new Node("", @"[5, 6, 7]");
            signaler.Signal("from-json", node);
            Assert.Equal("", node.Children.First().Name);
            Assert.Equal(5L, node.Children.First().Value);
            Assert.Equal("", node.Children.Skip(1).First().Name);
            Assert.Equal(6L, node.Children.Skip(1).First().Value);
            Assert.Equal("", node.Children.Skip(2).First().Name);
            Assert.Equal(7L, node.Children.Skip(2).First().Value);
        }

        [Fact]
        public void FromJsonArrayOfObjects()
        {
            var signaler = Common.GetSignaler();
            var node = new Node("", @"[{""foo1"": ""bar1""}, {""foo2"": ""bar2""}]");
            signaler.Signal("from-json", node);
            Assert.Equal("foo1", node.Children.First().Name);
            Assert.Equal("bar1", node.Children.First().Value);
            Assert.Equal("foo2", node.Children.Skip(1).First().Name);
            Assert.Equal("bar2", node.Children.Skip(1).First().Value);
        }

        [Fact]
        public void FromJsonArrayOfComplexObjects()
        {
            var signaler = Common.GetSignaler();
            var node = new Node("", @"[{""foo1"": {""name"": ""thomas""}}, {""foo2"": {""name"": ""hansen""}}]");
            signaler.Signal("from-json", node);
            Assert.Equal("foo1", node.Children.First().Name);
            Assert.Equal("name", node.Children.First().Children.First().Name);
            Assert.Equal("thomas", node.Children.First().Children.First().Value);
            Assert.Equal("foo2", node.Children.Skip(1).First().Name);
            Assert.Equal("name", node.Children.Skip(1).First().Children.First().Name);
            Assert.Equal("hansen", node.Children.Skip(1).First().Children.First().Value);
            signaler.Signal("hyper", node);
            Assert.Equal(@"foo1
   name:thomas
foo2
   name:hansen
".Replace("\r", "").Replace("\n", "\r\n"), node.Value);
        }

        [Fact]
        public void FromJsonComplexObjectWithArray()
        {
            var signaler = Common.GetSignaler();
            var node = new Node("", @"{""foo"":[{""foo1"":5}, {""foo2"":{""bar1"":7, ""boolean"":true}}], ""jo"":""dude""}");
            signaler.Signal("from-json", node);
            signaler.Signal("hyper", node);
            Assert.Equal(@"foo
   foo1:long:5
   foo2
      bar1:long:7
      boolean:bool:true
jo:dude
".Replace("\r", "").Replace("\n", "\r\n"), node.Value);
        }

        [Fact]
        public void ToJsonSimpleObject()
        {
            var signaler = Common.GetSignaler();
            var node = new Node("", @"
foo1
foo2:bar2
");
            signaler.Signal("lambda", node);
            signaler.Signal("to-json", node);
            Assert.Equal(@"{""foo1"":null,""foo2"":""bar2""}", node.Value);
        }

        [Fact]
        public void ToJsonSimpleArray_01()
        {
            var signaler = Common.GetSignaler();
            var node = new Node("", @"
:int:5
:int:7
");
            signaler.Signal("lambda", node);
            signaler.Signal("to-json", node);
            Assert.Equal(@"[5,7]", node.Value);
        }

        [Fact]
        public void ToJsonSimpleArray_02()
        {
            var signaler = Common.GetSignaler();
            var node = new Node("", @"
.:int:5
.:int:7
");
            signaler.Signal("lambda", node);
            signaler.Signal("to-json", node);
            Assert.Equal(@"[5,7]", node.Value);
        }

        [Fact]
        public void ToJsonComplexArray_01()
        {
            var signaler = Common.GetSignaler();
            var node = new Node("", @"
.
   foo1:bar1
.
   foo2:bar2
");
            signaler.Signal("lambda", node);
            signaler.Signal("to-json", node);
            Assert.Equal(@"[{""foo1"":""bar1""},{""foo2"":""bar2""}]", node.Value);
        }

        [Fact]
        public void ToJsonComplexArray_02()
        {
            var signaler = Common.GetSignaler();
            var node = new Node("", @"
.
   foo1
      foo11:bar11
.
   foo2
      foo22:bar22
");
            signaler.Signal("lambda", node);
            signaler.Signal("to-json", node);
            Assert.Equal(@"[{""foo1"":{""foo11"":""bar11""}},{""foo2"":{""foo22"":""bar22""}}]", node.Value);
        }
    }
}
