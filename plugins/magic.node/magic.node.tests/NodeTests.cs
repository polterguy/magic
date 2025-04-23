/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using Xunit;
using magic.node.extensions;

namespace magic.node.tests
{
    /*
     * Unit tests for lambda expressions.
     */
    public class NodeTests
    {
        [Fact]
        public void NoName()
        {
            var n = new Node();
            Assert.Equal("", n.Name);
            Assert.Null(n.Value);
            Assert.NotNull(n.Children);
            Assert.Empty(n.Children);
        }

        [Fact]
        public void SetNameNull_Throws()
        {
            var n = new Node();
            Assert.Throws<ArgumentNullException>(() => { n.Name = null; });
        }

        [Fact]
        public void OnlyName()
        {
            var n = new Node("foo");
            Assert.Equal("foo", n.Name);
            Assert.Null(n.Value);
            Assert.Empty(n.Children);
        }

        [Fact]
        public void NameValue()
        {
            var n = new Node("foo", "bar");
            Assert.Equal("foo", n.Name);
            Assert.Equal("bar", n.Value);
            Assert.Empty(n.Children);
        }

        [Fact]
        public void NameValueChildren()
        {
            var n = new Node("foo", "bar", new Node[] { new Node("howdy") });
            Assert.Equal("foo", n.Name);
            Assert.Equal("bar", n.Value);
            Assert.Single(n.Children);
            Assert.Equal("howdy", n.Children.First().Name);
            Assert.Equal("foo", n.Children.First().Parent.Name);
        }

        [Fact]
        public void GetNullParentPrevious()
        {
            var n = new Node();
            Assert.Null(n.Previous);
        }

        [Fact]
        public void GetNullParentNext()
        {
            var n = new Node();
            Assert.Null(n.Next);
        }

        [Fact]
        public void InsertBeforeThrows()
        {
            var n = new Node();
            Assert.Throws<ArgumentException>(() => n.InsertBefore(new Node()));
        }

        [Fact]
        public void RemoveThrows()
        {
            var n = new Node();
            Assert.Throws<ArgumentException>(() => n.Remove(new Node()));
        }

        [Fact]
        public void Clone()
        {
            var n1 = new Node("foo");
            n1.Add(new Node("bar"));
            var n2 = n1.Clone();
            Assert.Equal(n1.ToHyperlambda(), n2.ToHyperlambda());
        }

        [Fact]
        public void InsertAfterThrows()
        {
            var n = new Node();
            Assert.Throws<ArgumentException>(() => n.InsertAfter(new Node()));
        }

        [Fact]
        public void Add()
        {
            var n = new Node("parent");
            n.Add(new Node("foo"));
            Assert.Equal("foo", n.Children.First().Name);
            Assert.Equal("parent", n.Children.First().Parent.Name);
        }

        [Fact]
        public void AddFromOtherNode()
        {
            var n = new Node("parent");
            n.Add(new Node("foo"));
            var n2 = new Node("parent2");
            n2.Add(n.Children.First());
            Assert.Equal("foo", n2.Children.First().Name);
            Assert.Equal("parent2", n2.Children.First().Parent.Name);
            Assert.Empty(n.Children);
        }

        [Fact]
        public void InsertBefore()
        {
            var n = new Node("parent");
            n.Add(new Node("foo"));
            n.Children.First().InsertBefore(new Node("bar"));
            Assert.Equal("bar", n.Children.First().Name);
            Assert.Equal("foo", n.Children.Skip(1).First().Name);
            Assert.Equal("parent", n.Children.First().Parent.Name);
            Assert.Equal("parent", n.Children.Skip(1).First().Parent.Name);
        }

        [Fact]
        public void InsertBeforeFromOther()
        {
            var n1 = new Node("parent1");
            n1.Add(new Node("foo1"));

            var n2 = new Node("parent2");
            n2.Add(new Node("foo2"));

            n2.Children.First().InsertBefore(n1.Children.First());

            Assert.Equal("foo1", n2.Children.First().Name);
            Assert.Equal("foo2", n2.Children.Skip(1).First().Name);
            Assert.Equal("parent2", n2.Children.First().Parent.Name);
            Assert.Equal("parent2", n2.Children.Skip(1).First().Parent.Name);
            Assert.Empty(n1.Children);
        }

        [Fact]
        public void InsertAfter()
        {
            var n = new Node("parent");
            n.Add(new Node("foo"));
            n.Children.First().InsertAfter(new Node("bar"));
            Assert.Equal("foo", n.Children.First().Name);
            Assert.Equal("bar", n.Children.Skip(1).First().Name);
            Assert.Equal("parent", n.Children.First().Parent.Name);
            Assert.Equal("parent", n.Children.Skip(1).First().Parent.Name);
        }

        [Fact]
        public void InsertAfterFromOther()
        {
            var n1 = new Node("parent1");
            n1.Add(new Node("foo1"));

            var n2 = new Node("parent2");
            n2.Add(new Node("foo2"));

            n2.Children.First().InsertAfter(n1.Children.First());

            Assert.Equal("foo2", n2.Children.First().Name);
            Assert.Equal("foo1", n2.Children.Skip(1).First().Name);
            Assert.Equal("parent2", n2.Children.First().Parent.Name);
            Assert.Equal("parent2", n2.Children.Skip(1).First().Parent.Name);
            Assert.Empty(n1.Children);
        }

        [Fact]
        public void AddRangeFromOther()
        {
            var n1 = new Node("parent1", null, new Node[] { new Node("foo1"), new Node("foo2") });
            var n2 = new Node("parent2");
            n2.AddRange(n1.Children);
            Assert.Empty(n1.Children);
            Assert.Equal(2, n2.Children.Count());
        }

        [Fact]
        public void Clear()
        {
            var n1 = new Node("parent");
            var n2 = new Node();
            n1.Add(n2);
            var n3 = new Node();
            n1.Add(n3);
            n1.Clear();
            Assert.Empty(n1.Children);
            Assert.Null(n2.Parent);
            Assert.Null(n3.Parent);
        }

        [Fact]
        public void Untie()
        {
            var n1 = new Node("parent");
            var n2 = new Node();
            n1.Add(n2);
            var n3 = new Node();
            n1.Add(n3);
            n1.Children.First().UnTie();
            Assert.Single(n1.Children);
            n1.Children.First().UnTie();
            Assert.Empty(n1.Children);
            Assert.Null(n2.Parent);
            Assert.Null(n3.Parent);
        }

        [Fact]
        public void Next()
        {
            var n1 = new Node("parent1", null, new Node[] { new Node("foo1"), new Node("foo2") });
            Assert.Equal("foo2", n1.Children.First().Next.Name);
        }

        [Fact]
        public void Previous()
        {
            var n1 = new Node("parent1", null, new Node[] { new Node("foo1"), new Node("foo2") });
            Assert.Equal("foo1", n1.Children.Skip(1).First().Previous.Name);
        }

        [Fact]
        public void Get_01()
        {
            var node = new Node("", "5");
            var res = node.Get<int>();
            Assert.Equal(typeof(int), res.GetType());
        }

        [Fact]
        public void Get_02()
        {
            var node = new Node("", 5);
            var res = node.Get<int>();
            Assert.Equal(typeof(int), res.GetType());
        }

        [Fact]
        public void Get_03_Throws()
        {
            var node = new Node("");
            Assert.Throws<InvalidCastException>(() => node.Get<int>());
        }

        [Fact]
        public void GetEx_01()
        {
            var node = new Node("", "5");
            var res = node.GetEx<int>();
            Assert.Equal(typeof(int), res.GetType());
        }

        [Fact]
        public void GetEx_02()
        {
            var node = new Node("", "OK");
            node.Add(new Node("", new Expression(".")));
            var res = node.Children.First().GetEx<string>();
            Assert.Equal("OK", res);
        }

        [Fact]
        public void GetEx_03()
        {
            var node = new Node("", new Expression("1"));
            node.Add(new Node("", new Expression(".")));
            node.Add(new Node("", "OK"));
            var res = node.Children.First().GetEx<string>();
            Assert.Equal("OK", res);
        }

        [Fact]
        public void GetEx_04()
        {
            var node = new Node("", new Expression("1"));
            node.Add(new Node("", new Expression(".")));
            var res = node.Children.First().GetEx<int>();
            Assert.Equal(0, res);
        }

        [Fact]
        public void GetEx_05_Throws()
        {
            var node = new Node("", new Expression("*"));
            node.Add(new Node("", new Expression(".")));
            node.Add(new Node(""));
            Assert.Throws<HyperlambdaException>(() => node.Children.First().GetEx<int>());
        }

        [Fact]
        public void ToHyperlambda_01()
        {
            var node = new Node();
            node.Add(new Node("foo1", 5));
            node.Add(new Node("foo2", "bar"));
            var res = node.ToHyperlambda();
            Assert.Equal("\"\"\r\n   foo1:int:5\r\n   foo2:bar\r\n", res);
        }

        [Fact]
        public void ToHyperlambda_02()
        {
            var node = new Node();
            node.Add(new Node("foo1", 5));
            node.Add(new Node("foo2", "bar\r\nhowdy"));
            var res = node.ToHyperlambda();
            Assert.Equal("\"\"\r\n   foo1:int:5\r\n   foo2:@\"bar\r\nhowdy\"\r\n", res);
        }

        [Fact]
        public void ToHyperlambda_03()
        {
            var node = new Node();
            node.Add(new Node("foo1\r\nhowdy", 5));
            node.Add(new Node("foo2", "bar"));
            var res = node.ToHyperlambda();
            Assert.Equal("\"\"\r\n   @\"foo1\r\nhowdy\":int:5\r\n   foo2:bar\r\n", res);
        }

        [Fact]
        public void ToHyperlambda_04()
        {
            var node = new Node();
            node.Add(new Node(@"foo1""howdy", 5));
            node.Add(new Node("foo2", "bar"));
            var res = node.ToHyperlambda();
            Assert.Equal("\"\"\r\n   \"foo1\\\"howdy\":int:5\r\n   foo2:bar\r\n", res);
        }

        [Fact]
        public void ToHyperlambda_05()
        {
            var node = new Node();
            node.Add(new Node(@"foo1:howdy", 5));
            node.Add(new Node("foo2", "bar"));
            var res = node.ToHyperlambda();
            Assert.Equal("\"\"\r\n   \"foo1:howdy\":int:5\r\n   foo2:bar\r\n", res);
        }

        [Fact]
        public void ToHyperlambda_06()
        {
            var node = new Node();
            node.Add(new Node("foo1", 5));
            node.Add(new Node("foo2", "bar\"howdy"));
            var res = node.ToHyperlambda();
            Assert.Equal("\"\"\r\n   foo1:int:5\r\n   foo2:\"bar\\\"howdy\"\r\n", res);
        }

        [Fact]
        public void ConvertToStringByteArray()
        {
            var n1 = new Node("", "howdy world");
            var b = n1.Get<byte[]>();
            var n2 = new Node("", b);
            var result = n2.Get<string>();
            Assert.Equal("howdy world", result);
        }
    }
}
