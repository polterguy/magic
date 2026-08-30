/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using Xunit;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.data.common.tests
{
    public class SlotSignatureCrudTests
    {
        [Fact]
        public void ReturnsDataCreateChildren()
        {
            var lambda = Common.Evaluate(@"slot.signature:data.create");
            var children = Children(lambda);
            var databaseType = children.Children.First(x => x.Name == "database-type");
            var returnId = children.Children.First(x => x.Name == "return-id");
            var values = children.Children.First(x => x.Name == "values");
            var value = values.Children.First(x => x.Name == "children").Children.First(x => x.Name == "*");

            Assert.Equal("string", databaseType.Children.First(x => x.Name == "type").GetEx<string>());
            Assert.Equal("true", returnId.Children.First(x => x.Name == "default").GetEx<string>());
            Assert.True(values.Children.First(x => x.Name == "required").GetEx<bool>());
            Assert.Equal(SlotChildCardinality.ExactlyOne.ToString(), values.Children.First(x => x.Name == "cardinality").GetEx<string>());
            Assert.Equal(SlotChildMode.ValueOrExpression.ToString(), value.Children.First(x => x.Name == "mode").GetEx<string>());
        }

        [Fact]
        public void ReturnsSqlCreateChildrenWithoutDispatcherOrExecutionChildren()
        {
            var lambda = Common.Evaluate(@"slot.signature:sql.create");
            var children = Children(lambda);

            Assert.Contains(children.Children, x => x.Name == "table");
            Assert.Contains(children.Children, x => x.Name == "values");
            Assert.DoesNotContain(children.Children, x => x.Name == "database-type");
            Assert.DoesNotContain(children.Children, x => x.Name == "generate");
            Assert.DoesNotContain(children.Children, x => x.Name == "return-id");
        }

        [Fact]
        public void ReturnsSqlReadJoinAndWhereChildren()
        {
            var lambda = Common.Evaluate(@"slot.signature:sql.read");
            var children = Children(lambda);
            var table = children.Children.First(x => x.Name == "table");
            var join = table.Children.First(x => x.Name == "children").Children.First(x => x.Name == "join");
            var on = join.Children.First(x => x.Name == "children").Children.First(x => x.Name == "on");
            var where = children.Children.First(x => x.Name == "where");

            // Notice, the signature deliberately declares a single [table]; the SQL builder still accepts
            // multiple at runtime, but the comma-FROM shape is no longer taught through the signature.
            Assert.Equal(SlotChildCardinality.ExactlyOne.ToString(), table.Children.First(x => x.Name == "cardinality").GetEx<string>());
            Assert.True(on.Children.First(x => x.Name == "required").GetEx<bool>());
            Assert.Contains(where.Children.First(x => x.Name == "children").Children, x => x.Name == "and");
            // [@*] used to live on CRUD signatures, but it was misleading:
            // CRUD slots auto-generate their SQL and bind their own params
            // internally, so user-supplied `@xxx` children are just dangling
            // data the generated SQL never references. The schema now only
            // exposes the structured CRUD shape; raw `@param` placeholders
            // belong on [*.execute] / [*.scalar] / [*.select] via SqlParameter.
            Assert.DoesNotContain(children.Children, x => x.Name == "@*");
        }

        [Fact]
        public void ReturnsDataExecuteSqlParameterChildren()
        {
            var lambda = Common.Evaluate(@"slot.signature:data.execute");
            var children = Children(lambda);
            var databaseType = children.Children.First(x => x.Name == "database-type");
            var parameter = children.Children.First(x => x.Name == "*");

            Assert.Equal("Database adapter to use instead of the configured default", databaseType.Children.First(x => x.Name == "description").GetEx<string>());
            Assert.Equal("SQL parameter value; child name is used as the parameter name referenced by the SQL statement", parameter.Children.First(x => x.Name == "description").GetEx<string>());
            Assert.Equal(SlotChildRole.Arguments.ToString(), parameter.Children.First(x => x.Name == "role").GetEx<string>());
            Assert.Equal(SlotChildProjection.Value.ToString(), parameter.Children.First(x => x.Name == "projection").GetEx<string>());
        }

        [Fact]
        public void ReturnsDataSelectMaxAndSqlParameterChildren()
        {
            var lambda = Common.Evaluate(@"slot.signature:data.select");
            var children = Children(lambda);

            Assert.Contains(children.Children, x => x.Name == "database-type");
            Assert.Contains(children.Children, x => x.Name == "max");
            Assert.Contains(children.Children, x => x.Name == "multiple-result-sets");
            Assert.Contains(children.Children, x => x.Name == "*");
        }

        [Fact]
        public void ReturnsDataConnectChildren()
        {
            var lambda = Common.Evaluate(@"slot.signature:data.connect");
            var signature = lambda.Children.First();
            var input = signature.Children.First(x => x.Name == "input");
            var children = Children(lambda);
            var databaseType = children.Children.First(x => x.Name == "database-type");
            var body = children.Children.First(x => x.Name == "*");

            Assert.False(input.Children.First(x => x.Name == "required").GetEx<bool>());
            Assert.Equal("Database adapter to use instead of the configured default", databaseType.Children.First(x => x.Name == "description").GetEx<string>());
            Assert.Equal(SlotChildMode.ExecutableLambda.ToString(), body.Children.First(x => x.Name == "mode").GetEx<string>());
            Assert.Equal(SlotChildRole.ExecutableBody.ToString(), body.Children.First(x => x.Name == "role").GetEx<string>());
            Assert.Equal(SlotChildEvaluation.EvalSelf.ToString(), body.Children.First(x => x.Name == "evaluation").GetEx<string>());
            Assert.Equal(SlotChildProjection.Self.ToString(), body.Children.First(x => x.Name == "projection").GetEx<string>());
        }

        static Node Children(Node lambda)
        {
            return lambda.Children.First().Children.First(x => x.Name == "children");
        }
    }
}
