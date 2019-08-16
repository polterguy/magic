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
        public void SimpleObject()
        {
            var signaler = Common.GetSignaler();
            var node = new Node("", @"{""foo"":5}");
            signaler.Signal("from-json", node);
            Assert.Equal("foo", node.Children.First().Name);
            Assert.Equal(5L, node.Children.First().Value);
        }

        [Fact]
        public void MultipleProperties()
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
        public void ArrayOfIntegers()
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
        public void ArrayOfObjects()
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
        public void ArrayOfComplexObjects()
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
".Replace("\r\n", "\n"), node.Value);
        }

        [Fact]
        public void ComplexObjectWithArray()
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
".Replace("\r\n", "\n"), node.Value);
        }
    }
}
