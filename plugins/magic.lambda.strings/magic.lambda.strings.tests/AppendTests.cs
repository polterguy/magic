/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Text
using System.Threading.Tasks;
using Xunit;
using magic.node.extensions;

namespace magic.lambda.strings.builder.tests
{
    public class AppendTests
    {
        [Fact]
        public void Append()
        {
            var lambda = Common.Evaluate(@"
strings.builder
   strings.builder.append:""howdy""
   strings.builder.append:""  world""
get-value:x@strings.builder
");
            Assert.Equal("howdy world", lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public async Task AppendAsync()
        {
            var lambda = await Common.EvaluateAsync(@"
strings.builder
   strings.builder.append:""howdy""
   strings.builder.append:""  world""
get-value:x@strings.builder
");
            Assert.Equal("howdy world", lambda.Children.Skip(1).First().Value);
        }
    }
}