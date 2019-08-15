/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System.Linq;
using Xunit;

namespace magic.tests.lambda
{
    public class HttpTests
    {
        [Fact]
        public void GetJson()
        {
            var lambda = Common.Evaluate(@"
http.get.json:""https://jsonplaceholder.typicode.com/users""
");
            Assert.True(lambda.Children.First().Get<string>().Length > 0);
        }

        [Fact]
        public void PostJson()
        {
            var lambda = Common.Evaluate(@"
http.post.json:""https://jsonplaceholder.typicode.com/posts""
   payload:@""{""""userId"""":1, """"id"""":1}""
");
            Assert.True(lambda.Children.First().Get<string>().Length > 0);
        }
    }
}
