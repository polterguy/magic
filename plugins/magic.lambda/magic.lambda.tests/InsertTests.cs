/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace magic.lambda.tests
{
    public class InsertTests
    {
        [Fact]
        public void InsertAfter_01()
        {
            var lambda = Common.Evaluate(@"
.dest
   dest
insert-after:x:-/*
   .
      .foo1
      .foo2
");
            Assert.Equal(".foo1", lambda.Children.First().Children.Skip(1).First().Name);
            Assert.Equal(".foo2", lambda.Children.First().Children.Skip(2).First().Name);
        }

        [Fact]
        public async Task InsertAfter_01Async()
        {
            var lambda = await Common.EvaluateAsync(@"
.dest
   dest
insert-after:x:-/*
   .
      .foo1
      .foo2
");
            Assert.Equal(".foo1", lambda.Children.First().Children.Skip(1).First().Name);
            Assert.Equal(".foo2", lambda.Children.First().Children.Skip(2).First().Name);
        }

        [Fact]
        public void InsertBefore_01()
        {
            var lambda = Common.Evaluate(@"
.dest
   dest
insert-before:x:-/*
   .
      .foo1
      .foo2
");
            Assert.Equal(".foo1", lambda.Children.First().Children.First().Name);
            Assert.Equal(".foo2", lambda.Children.First().Children.Skip(1).First().Name);
        }

        [Fact]
        public async Task InsertBefore_01Async()
        {
            var lambda = await Common.EvaluateAsync(@"
.dest
   dest
insert-before:x:-/*
   .
      .foo1
      .foo2
");
            Assert.Equal(".foo1", lambda.Children.First().Children.First().Name);
            Assert.Equal(".foo2", lambda.Children.First().Children.Skip(1).First().Name);
        }
    }
}
