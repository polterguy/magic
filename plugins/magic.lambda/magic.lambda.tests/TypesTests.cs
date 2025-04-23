/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using magic.node.extensions;
using Xunit;

namespace magic.lambda.tests
{
    public class TypesTests
    {
        [Fact]
        public void Value()
        {
            var lambda = Common.Evaluate(@"types");
            Assert.Equal(21, lambda.Children.First().Children.Count());
            var types = new string[] {
                "bytes",
                "short",
                "ushort",
                "int",
                "uint",
                "long",
                "ulong",
                "decimal",
                "double",
                "single",
                "float",
                "char",
                "byte",
                "string",
                "bool",
                "date",
                "time",
                "guid",
                "x",
                "node"};
            foreach (var idxType in types)
            {
                Assert.Single(lambda.Children.First().Children.Where(x => x.Get<string>() == idxType));
            }
        }
    }
}
