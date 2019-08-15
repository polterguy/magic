/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System.Linq;
using Xunit;
using magic.node;

namespace magic.tests.lambda
{
    public class ExceptionsTests
    {
        [Fact]
        public void TryThrow()
        {
            var lambda = Common.Evaluate(@"try
   throw:foo
.catch
   unwrap:x:+/*
   return
      .message:x:@.arguments/*/message");
            Assert.Equal("foo", lambda.GetList<Node>().First().Value);
        }

        [Fact]
        public void TryNoThrow()
        {
            var lambda = Common.Evaluate(@"try
   .no-throw
.catch
   unwrap:x:+/*
   return
      .message:x:@.arguments/*/message");
            Assert.Null(lambda.Value);
        }

        [Fact]
        public void FinallyThrows()
        {
            var lambda = Common.Evaluate(@"try
   try
      throw:foo
   .finally
      return
         .message:foo
.catch
   set-value:x:@try
      .:OK");
            Assert.Equal("foo", lambda.GetList<Node>().First().Value);
            Assert.Equal("OK", lambda.Children.First().Value);
        }

        [Fact]
        public void FinallyNoThrow()
        {
            var lambda = Common.Evaluate(@"try
   .no-throw
.finally
   return
      .message:foo");
            Assert.Equal("foo", lambda.GetList<Node>().First().Value);
        }
    }
}
