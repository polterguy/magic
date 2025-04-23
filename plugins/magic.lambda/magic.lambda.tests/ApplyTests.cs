/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using Xunit;
using magic.node.extensions;

namespace magic.lambda.tests
{
    public class ApplyTests
    {
        [Fact]
        public void SimpleApply()
        {
            var lambda = Common.Evaluate(@"
.applied
   foo1:{foo1}
   foo2:{foo2}
apply:x:-
   foo1:bar1
   foo2
      bar1
      bar2");
            Assert.Equal("bar1", lambda.Children.Skip(1).First().Children.First().Value);
            Assert.Equal(2, lambda.Children.Skip(1).First().Children.Skip(1).First().Children.Count());
            Assert.Equal("bar1", lambda.Children.Skip(1).First().Children.Skip(1).First().Children.First().Name);
            Assert.Equal("bar2", lambda.Children.Skip(1).First().Children.Skip(1).First().Children.Skip(1).First().Name);
        }

        [Fact]
        public void ApplyName()
        {
            var lambda = Common.Evaluate(@"
.applied
   foo1:{foo1}
   {foo2}:its-value
apply:x:-
   foo1:bar1
   foo2:new_foo2");
            Assert.Equal("bar1", lambda.Children.Skip(1).First().Children.First().Value);
            Assert.Equal("new_foo2", lambda.Children.Skip(1).First().Children.Skip(1).First().Name);
            Assert.Equal("its-value", lambda.Children.Skip(1).First().Children.Skip(1).First().Value);
        }

        [Fact]
        public void ApplyThrows_01()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
.applied
   foo1:{foo1}
   foo2:{foo2}
apply:x:-
   foo1:bar1"));
        }

        [Fact]
        public void ApplyThrows_02()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
.applied
   {foo1}:howdy
   {foo2}:world
apply:x:-
   foo1:bar1"));
        }
    }
}
