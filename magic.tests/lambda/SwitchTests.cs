/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System.Linq;
using Xunit;

namespace magic.tests.lambda
{
    public class SwitchTests
    {
        [Fact]
        public void SwitchSimple()
        {
            var lambda = Common.Evaluate(@".result
.foo:bar
switch:x:@.foo
   case:bar
      set-value:x:@.result
         .:OK");
            Assert.Equal("OK", lambda.Children.First().Value);
        }

        [Fact]
        public void SwitchDefault()
        {
            var lambda = Common.Evaluate(@".result
.foo:barXX
switch:x:@.foo
   case:bar
      .do-nothing
   default
      set-value:x:@.result
         .:OK");
            Assert.Equal("OK", lambda.Children.First().Value);
        }

        [Fact]
        public void SwitchComplex()
        {
            var lambda = Common.Evaluate(@".result
.foo:bar2
switch:x:@.foo
   case:bar1
      set-value:x:@.result
         .:ERROR
   case:bar2
      set-value:x:@.result
         .:OK
   default
      set-value:x:@.result
         .:ERROR");
            Assert.Equal("OK", lambda.Children.First().Value);
        }

        [Fact]
        public void NothingDone()
        {
            var lambda = Common.Evaluate(@".result
.foo:barXX
switch:x:@.foo
   case:bar1
      set-value:x:@.result
         .:ERROR
   case:bar2
      set-value:x:@.result
         .:ERROR");
            Assert.Null(lambda.Children.First().Value);
        }
    }
}
