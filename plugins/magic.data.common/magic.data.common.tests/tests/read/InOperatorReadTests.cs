/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using Xunit;
using magic.node;
using magic.node.extensions;
using magic.data.common.builders;

namespace magic.data.common.tests.tests.read
{
    public class InOperatorReadTests
    {
        [Fact]
        public void LongValues()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            var where = new Node("where");
            var and1 = new Node("and");
            var in1 = new Node("field1.in");
            in1.Add(new Node("", 5L));
            in1.Add(new Node("", 7L));
            in1.Add(new Node("", 9L));
            and1.Add(in1);
            where.Add(and1);
            node.Add(where);
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            var result = builder.Build();
            var sql = result.Get<string>();
            Assert.Equal("select * from 'foo' where 'field1' in (@0,@1,@2) limit 25", sql);

            var arg1 = result.Children.First();
            Assert.Equal("@0", arg1.Name);
            Assert.Equal(5L, arg1.Value);

            var arg2 = result.Children.Skip(1).First();
            Assert.Equal("@1", arg2.Name);
            Assert.Equal(7L, arg2.Value);

            var arg3 = result.Children.Skip(2).First();
            Assert.Equal("@2", arg3.Name);
            Assert.Equal(9L, arg3.Value);
        }

        [Fact]
        public void StringValues()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            var where = new Node("where");
            var and1 = new Node("and");
            var in1 = new Node("field1.in");
            in1.Add(new Node("", "howdy"));
            in1.Add(new Node("", "world"));
            in1.Add(new Node("", "jalla"));
            and1.Add(in1);
            where.Add(and1);
            node.Add(where);
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            var result = builder.Build();
            var sql = result.Get<string>();
            Assert.Equal("select * from 'foo' where 'field1' in (@0,@1,@2) limit 25", sql);

            var arg1 = result.Children.First();
            Assert.Equal("@0", arg1.Name);
            Assert.Equal("howdy", arg1.Value);

            var arg2 = result.Children.Skip(1).First();
            Assert.Equal("@1", arg2.Name);
            Assert.Equal("world", arg2.Value);

            var arg3 = result.Children.Skip(2).First();
            Assert.Equal("@2", arg3.Name);
            Assert.Equal("jalla", arg3.Value);
        }

        [Fact]
        public void MultipleInOperators()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            var where = new Node("where");
            var and1 = new Node("and");
            var in1 = new Node("field1.in");
            in1.Add(new Node("", "howdy"));
            in1.Add(new Node("", "world"));
            in1.Add(new Node("", "jalla"));
            and1.Add(in1);
            var in2 = new Node("field2.in");
            in2.Add(new Node("", "howdy2"));
            in2.Add(new Node("", "world2"));
            in2.Add(new Node("", "jalla2"));
            and1.Add(in2);
            where.Add(and1);
            node.Add(where);
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            var result = builder.Build();
            var sql = result.Get<string>();
            Assert.Equal("select * from 'foo' where 'field1' in (@0,@1,@2) and 'field2' in (@3,@4,@5) limit 25", sql);

            var arg1 = result.Children.First();
            Assert.Equal("@0", arg1.Name);
            Assert.Equal("howdy", arg1.Value);

            var arg2 = result.Children.Skip(1).First();
            Assert.Equal("@1", arg2.Name);
            Assert.Equal("world", arg2.Value);

            var arg3 = result.Children.Skip(2).First();
            Assert.Equal("@2", arg3.Name);
            Assert.Equal("jalla", arg3.Value);

            var arg4 = result.Children.Skip(3).First();
            Assert.Equal("@3", arg4.Name);
            Assert.Equal("howdy2", arg4.Value);

            var arg5 = result.Children.Skip(4).First();
            Assert.Equal("@4", arg5.Name);
            Assert.Equal("world2", arg5.Value);

            var arg6 = result.Children.Skip(5).First();
            Assert.Equal("@5", arg6.Name);
            Assert.Equal("jalla2", arg6.Value);
        }

        [Fact]
        public void WithTableNamespace()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            var where = new Node("where");
            var and1 = new Node("and");
            var in1 = new Node("foo.field1.in");
            in1.Add(new Node("", 5L));
            in1.Add(new Node("", 7L));
            in1.Add(new Node("", 9L));
            and1.Add(in1);
            where.Add(and1);
            node.Add(where);
            var builder = new SqlReadBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            var result = builder.Build();
            var sql = result.Get<string>();
            Assert.Equal("select * from 'foo' where 'foo'.'field1' in (@0,@1,@2) limit 25", sql);

            var arg1 = result.Children.First();
            Assert.Equal("@0", arg1.Name);
            Assert.Equal(5L, arg1.Value);

            var arg2 = result.Children.Skip(1).First();
            Assert.Equal("@1", arg2.Name);
            Assert.Equal(7L, arg2.Value);

            var arg3 = result.Children.Skip(2).First();
            Assert.Equal("@2", arg3.Name);
            Assert.Equal(9L, arg3.Value);
        }
    }
}
