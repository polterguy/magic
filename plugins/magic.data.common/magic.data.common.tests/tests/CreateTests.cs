/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using Xunit;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.data.common.helpers;
using magic.data.common.builders;

namespace magic.data.common.tests.tests
{
    public class CreateTests
    {
        class SqlMockCreateBuilder : SqlCreateBuilder
        {
            public SqlMockCreateBuilder(Node node)
                : base(node, "'")
            { }
        }

        [Fact]
        public void SingleValue()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            var values = new Node("values");
            values.Add(new Node("field1", "howdy"));
            node.Add(values);
            var builder = new SqlCreateBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            var result = builder.Build();
            var sql = result.Get<string>();
            var arg1 = result.Children.First();
            Assert.Equal("insert into 'foo' ('field1') values (@0)", sql);
            Assert.Equal("@0", arg1.Name);
            Assert.Equal("howdy", arg1.Get<string>());
        }

        [Fact]
        public void MultipleValues()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            var values = new Node("values");
            values.Add(new Node("field1", "howdy"));
            values.Add(new Node("field2", "world"));
            node.Add(values);
            var builder = new SqlCreateBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            var result = builder.Build();
            var sql = result.Get<string>();
            Assert.Equal("insert into 'foo' ('field1', 'field2') values (@0, @1)", sql);
            var arg1 = result.Children.First();
            Assert.Equal("@0", arg1.Name);
            Assert.Equal("howdy", arg1.Get<string>());
            var arg2 = result.Children.Skip(1).First();
            Assert.Equal("@1", arg2.Name);
            Assert.Equal("world", arg2.Get<string>());
        }

        [Fact]
        public void NullValue()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            var values = new Node("values");
            values.Add(new Node("field1", "howdy"));
            values.Add(new Node("field2"));
            node.Add(values);
            var builder = new SqlCreateBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            var result = builder.Build();
            var sql = result.Get<string>();
            Assert.Equal("insert into 'foo' ('field1', 'field2') values (@0, null)", sql);
            var arg1 = result.Children.First();
            Assert.Equal("@0", arg1.Name);
            Assert.Equal("howdy", arg1.Get<string>());
        }

        [Fact]
        public void MultipleValuesThrows_01()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            var values = new Node("values");
            values.Add(new Node("field1", "howdy"));
            node.Add(values);
            node.Add(new Node("values"));
            var builder = new SqlCreateBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            Assert.Throws<HyperlambdaException>(() => builder.Build());
        }

        [Fact]
        public void NoValuesContent_Throws()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            var values = new Node("values");
            node.Add(values);
            var builder = new SqlCreateBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            Assert.Throws<HyperlambdaException>(() => builder.Build());
        }

        [Fact]
        public void NoTable_Throws()
        {
            // Creating node hierarchy.
            var node = new Node();
            var values = new Node("values");
            values.Add(new Node("field1", "howdy"));
            node.Add(values);
            Assert.Throws<HyperlambdaException>(() => new SqlCreateBuilder(node, "'").Build());
        }

        [Fact]
        public void GenerateArgument()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("generate", true));
            node.Add(new Node("table", "foo"));
            var values = new Node("values");
            values.Add(new Node("field1", "howdy"));
            node.Add(values);
            var builder = new SqlCreateBuilder(node, "'");

            // Extracting SQL + params, and asserting correctness.
            Assert.True(builder.IsGenerateOnly);
            var result = builder.Build();
            var sql = result.Get<string>();
            var arg1 = result.Children.First();
            Assert.Equal("insert into 'foo' ('field1') values (@0)", sql);
            Assert.Equal("@0", arg1.Name);
            Assert.Equal("howdy", arg1.Get<string>());
        }

        [Fact]
        public void Parse()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            var values = new Node("values");
            values.Add(new Node("field1", "howdy"));
            node.Add(values);
            var result = SqlBuilder.Parse(new SqlMockCreateBuilder(node));
            Assert.NotNull(result);

            // Extracting SQL + params, and asserting correctness.
            var sql = result.Get<string>();
            var arg1 = result.Children.First();
            Assert.Equal("insert into 'foo' ('field1') values (@0)", sql);
            Assert.Equal("@0", arg1.Name);
            Assert.Equal("howdy", arg1.Get<string>());
        }

        [Fact]
        public void ParseWithGenerate()
        {
            // Creating node hierarchy.
            var node = new Node();
            node.Add(new Node("table", "foo"));
            node.Add(new Node("generate", true));
            var values = new Node("values");
            values.Add(new Node("field1", "howdy"));
            node.Add(values);
            var result = SqlBuilder.Parse(new SqlMockCreateBuilder(node));
            Assert.Null(result);

            // Extracting SQL + params, and asserting correctness.
            var sql = node.Get<string>();
            var arg1 = node.Children.First();
            Assert.Equal("insert into 'foo' ('field1') values (@0)", sql);
            Assert.Equal("@0", arg1.Name);
            Assert.Equal("howdy", arg1.Get<string>());
        }

        [Fact]
        public void NoRootNode_Throws()
        {
            Assert.Throws<ArgumentNullException>(() => new SqlCreateBuilder(null, "'"));
        }

        [Fact]
        public void NoEscapeCharacter_Throws()
        {
            Assert.Throws<ArgumentNullException>(() => new SqlCreateBuilder(new Node(), null));
        }
    }
}
