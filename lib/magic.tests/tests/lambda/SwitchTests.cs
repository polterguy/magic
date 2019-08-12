/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System.Linq;
using Xunit;

namespace magic.tests.tests.lambda
{
    public class SwitchTests
    {
        [Fact]
        public void SwitchSimple()
        {
            var lambda = Common.Evaluate(@".result
.foo:bar
switch
   value:x:@.foo
   case:bar
      set-value:x:@.result
         .:OK");
            Assert.Equal("OK", lambda.Children.First().Value);
        }

        [Fact]
        public void SwitchDefault()
        {
            var lambda = Common.Evaluate(@".result
.foo:bar
switch
   value:x:@.foo
   case:bar2
      .do-nothing
   default:
      set-value:x:@.result
         .:OK");
            Assert.Equal("OK", lambda.Children.First().Value);
        }

        [Fact]
        public void SwitchComplex()
        {
            var lambda = Common.Evaluate(@".result
.foo:bar
switch
   value:x:@.foo
   case:bar2
      set-value:x:@.result
         .:ERROR
   case:bar
      set-value:x:@.result
         .:OK
   default
      set-value:x:@.result
         .:ERROR");
            Assert.Equal("OK", lambda.Children.First().Value);
        }
    }
}
