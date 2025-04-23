/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using magic.node.extensions;
using Xunit;

namespace magic.lambda.strings.tests
{
    public class MiscStringTests
    {
        [Fact]
        public void Capitalize()
        {
            var lambda = Common.Evaluate(@"
.foo:foo
strings.capitalize:x:-");
            Assert.Equal("Foo", lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void ToLowers()
        {
            var lambda = Common.Evaluate(@"
.foo:FOO
strings.to-lower:x:-");
            Assert.Equal("foo", lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void ToUppers()
        {
            var lambda = Common.Evaluate(@"
.foo:foo
strings.to-upper:x:-");
            Assert.Equal("FOO", lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Length()
        {
            var lambda = Common.Evaluate(@"
.foo:foo
strings.length:x:-");
            Assert.Equal(3, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Mixin_01()
        {
            var lambda = Common.Evaluate(@"
.foo:@""foo {{return:bar}}""
strings.mixin:x:-");
            Assert.Equal("foo bar", lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Mixin_02()
        {
            var lambda = Common.Evaluate(@"
.foo:@""foo {{


return:bar

}}""
strings.mixin:x:-");
            Assert.Equal("foo bar", lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Mixin_03()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
.foo:@""foo {{return:bar}""
strings.mixin:x:-"));
        }

        [Fact]
        public void Mixin_04()
        {
            var lambda = Common.Evaluate(@"
.foo:@""foo {{


.foo

}}""
strings.mixin:x:-");
            Assert.Equal("foo ", lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Mixin_05()
        {
            var lambda = Common.Evaluate(@"
.foo:@""foo {.foo}}""
strings.mixin:x:-");
            Assert.Equal("foo {.foo}}", lambda.Children.Skip(1).First().Value);
        }
    }
}
