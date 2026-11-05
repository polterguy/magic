/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Linq;
using Xunit;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.sqlite.tests
{
    public class SlotSignatureCrudTests
    {
        [Fact]
        public void ReturnsSqliteCreateExecutionChildren()
        {
            var lambda = Common.Evaluate(@"slot.signature:sqlite.create");
            var children = lambda.Children.First().Children.First(x => x.Name == "children");
            var generate = children.Children.First(x => x.Name == "generate");
            var values = children.Children.First(x => x.Name == "values");

            Assert.Equal("false", generate.Children.First(x => x.Name == "default").GetEx<string>());
            Assert.Equal(SlotChildMode.DynamicNamedValues.ToString(), values.Children.First(x => x.Name == "mode").GetEx<string>());
            Assert.DoesNotContain(children.Children, x => x.Name == "database-type");
        }
    }
}
