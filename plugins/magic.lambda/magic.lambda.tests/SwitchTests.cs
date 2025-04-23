/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Threading.Tasks;
using Xunit;
using magic.node.extensions;

namespace magic.lambda.tests
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
        public void SwitchFallthrough_01()
        {
            var lambda = Common.Evaluate(@".result
.foo:bar
switch:x:@.foo
   case:foo
   case:bar
      set-value:x:@.result
         .:OK");
            Assert.Equal("OK", lambda.Children.First().Value);
        }

        [Fact]
        public void SwitchFallthrough_02()
        {
            var lambda = Common.Evaluate(@".result
.foo:bar
switch:x:@.foo
   case:bar
   case:foo
      set-value:x:@.result
         .:OK");
            Assert.Equal("OK", lambda.Children.First().Value);
        }

        [Fact]
        public void SwitchThrow_01()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@".result
.foo:bar
switch:x:@.foo
   caseX:foo
   case:bar
      set-value:x:@.result
         .:OK"));
        }

        [Fact]
        public void SwitchThrow_02()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@".result
.foo:bar
switch:x:@.foo"));
        }

        [Fact]
        public void SwitchThrow_03()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@".result
.foo:bar
switch:x:@.foo
   case
      set-value:x:@.result
         .:OK"));
        }

        [Fact]
        public void SwitchThrow_04()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@".result
.foo:bar
switch:x:@.foo
   case:xxx
   default:howdy
      set-value:x:@.result
         .:OK"));
        }

        [Fact]
        public void SwitchThrow_05()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@".result
.foo:bar
switch:x:@.foo
   case:foo
   default"));
        }

        [Fact]
        public void CaseThrows()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
.result
.foo:bar
case:bar
   set-value:x:@.result
      .:OK"));
        }

        [Fact]
        public async Task SwitchSimpleAsync()
        {
            var lambda = await Common.EvaluateAsync(@".result
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
        public void DefaultThrows()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
default
   set-value:x:@.result
      .:OK"));
        }

        [Fact]
        public async Task SwitchDefaultAsync()
        {
            var lambda = await Common.EvaluateAsync(@".result
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
