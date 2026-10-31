/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.IO;
using System.Linq;
using System.Text;
using Xunit;
using magic.lambda.io.tests.helpers;
using magic.node.extensions;

namespace magic.lambda.io.tests
{
    /*
     * A placeholder in a mixin file either names a value, or names a lambda object, which is executed and replaced
     * by what it returns.
     */
    public class MixinLambdaTests
    {
        static string Mix(string page, string codebehind)
        {
            var content = Encoding.UTF8.GetBytes(page);
            var fileService = new FileService
            {
                ExistsAction = path => path.EndsWith("/etc/page.hl"),
                LoadAction = _ => codebehind,
            };
            var streamService = new StreamService { OpenFileAction = _ => new MemoryStream(content) };
            var result = Common.Evaluate("io.file.mixin:/etc/page.html", fileService, streamService: streamService);
            return result.Children.First().Get<string>();
        }

        [Fact]
        public void APlaceholderNamingALambdaIsReplacedByWhatItReturns()
        {
            Assert.Equal("<p>computed</p>", Mix("<p>{{*/.fn}}</p>", ".fn\n   return:computed"));
        }

        [Fact]
        public void EveryStatementOfTheLambdaIsExecutedUpToTheReturn()
        {
            Assert.Equal("<p>computed</p>", Mix("<p>{{*/.fn}}</p>", ".fn\n   .:ignored\n   return:computed"));
        }

        [Fact]
        public void APlaceholderCanBeUsedMoreThanOnce()
        {
            Assert.Equal("computed and computed", Mix("{{*/.fn}} and {{*/.fn}}", ".fn\n   return:computed"));
        }

        [Fact]
        public void APlaceholderNamingNothingIsRejected()
        {
            var exception = Assert.Throws<HyperlambdaException>(() => Mix("{{*/.missing}}", ".fn\n   return:computed"));
            Assert.Equal("Expression '*/.missing' referenced in mixin file '/etc/page.html' returned no nodes", exception.Message);
        }
    }
}
