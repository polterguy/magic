/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using Xunit;
using magic.node.extensions;

namespace magic.lambda.json.tests
{
    public class Json2YamlTests
    {
        [Fact]
        public void ConvertsJsonToYaml()
        {
            var lambda = Common.Evaluate("json2yaml:@\"{\"\"a\"\":1,\"\"b\"\":[1,2],\"\"c\"\":{\"\"d\"\":\"\"e\"\"}}\"");
            var yaml = lambda.Children.First().Get<string>().Replace("\r\n", "\n");
            Assert.Contains("a: 1", yaml);
            Assert.Contains("b:", yaml);
            Assert.Contains("- 1", yaml);
            Assert.Contains("d: e", yaml);
        }

        [Fact]
        public void ChildrenAreClearedBeforeConverting()
        {
            var lambda = Common.Evaluate("json2yaml:@\"{\"\"a\"\":1}\"\n   .:ignored");
            Assert.Empty(lambda.Children.First().Children);
        }
    }
}
