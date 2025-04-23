/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Threading.Tasks;
using Xunit;
using magic.node.extensions;

namespace magic.lambda.strings.tests
{
    public class JoinTests
    {
        [Fact]
        public void Join_001()
        {
            var lambda = Common.Evaluate(@"
.foo
   .:a
   .:b
   .:c
strings.join:x:-/*
   .:'-'");
            Assert.Equal("a-b-c", lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public async Task JoinAsync()
        {
            var lambda = await Common.EvaluateAsync(@"
.foo
   .:a
   .:b
   .:c
strings.join:x:-/*
   .:'-x-'");
            Assert.Equal("a-x-b-x-c", lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Join_002()
        {
            var lambda = Common.Evaluate(@"
.foo
   .:a
   .:b
   .:c
strings.join:x:-/*");
            Assert.Equal("abc", lambda.Children.Skip(1).First().Value);
        }
    }
}
