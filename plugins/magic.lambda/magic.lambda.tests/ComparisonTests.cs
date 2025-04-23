/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Threading.Tasks;
using Xunit;
using magic.node.extensions;

namespace magic.lambda.tests
{
    public class ComparisonTests
    {
        [Fact]
        public void Eq_01()
        {
            var lambda = Common.Evaluate(@"
.foo1:OK
eq
   get-value:x:../*/.foo1
   .:OK");
            Assert.True(lambda.Children.Skip(1).First().Get<bool>());
        }

        [Fact]
        public void EqExpression_01()
        {
            var lambda = Common.Evaluate(@"
.foo1:OK
eq:x:../*/.foo1
   .:OK");
            Assert.True(lambda.Children.Skip(1).First().Get<bool>());
        }

        [Fact]
        public void EqStatic_01()
        {
            var lambda = Common.Evaluate(@"
eq:OK
   .:OK");
            Assert.True(lambda.Children.First().Get<bool>());
        }

        [Fact]
        public void EqStatic_02()
        {
            var lambda = Common.Evaluate(@"
eq:NOT-OK
   .:OK");
            Assert.False(lambda.Children.First().Get<bool>());
        }

        [Fact]
        public void Neq_01()
        {
            var lambda = Common.Evaluate(@"
.foo1:OK
neq
   get-value:x:../*/.foo1
   .:OK");
            Assert.False(lambda.Children.Skip(1).First().Get<bool>());
        }

        [Fact]
        public void NeqExpression_01()
        {
            var lambda = Common.Evaluate(@"
.foo1:OK
neq:x:../*/.foo1
   .:OK");
            Assert.False(lambda.Children.Skip(1).First().Get<bool>());
        }

        [Fact]
        public void Eq_Throws_01()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
.foo1:OK
eq
   get-value:x:../*/.foo1"));
        }

        [Fact]
        public void Eq_Throws_02()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
eq:x:../*/.foo1"));
        }

        [Fact]
        public void Eq_Throws_03()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
eq
   .:foo1
   .:foo2
   .:foo3"));
        }

        [Fact]
        public void Neq_Throws()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
.foo1:OK
neq
   get-value:x:../*/.foo1"));
        }

        [Fact]
        public async Task Eq_01Async()
        {
            var lambda = await Common.EvaluateAsync(@"
.foo1:OK
eq
   get-value:x:../*/.foo1
   .:OK");
            Assert.True(lambda.Children.Skip(1).First().Get<bool>());
        }

        [Fact]
        public async Task EqExpression_01Async()
        {
            var lambda = await Common.EvaluateAsync(@"
.foo1:OK
eq:x:../*/.foo1
   .:OK");
            Assert.True(lambda.Children.Skip(1).First().Get<bool>());
        }

        [Fact]
        public async Task Neq_01Async()
        {
            var lambda = await Common.EvaluateAsync(@"
.foo1:OK
neq
   get-value:x:../*/.foo1
   .:OK");
            Assert.False(lambda.Children.Skip(1).First().Get<bool>());
        }

        [Fact]
        public async Task NeqExpression_01Async()
        {
            var lambda = await Common.EvaluateAsync(@"
.foo1:OK
neq:x:../*/.foo1
   .:OK");
            Assert.False(lambda.Children.Skip(1).First().Get<bool>());
        }

        [Fact]
        public void Eq_02()
        {
            var lambda = Common.Evaluate(@"
.foo1:not OK
eq
   get-value:x:../*/.foo1
   .:OK");
            Assert.Equal(false, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Eq_03()
        {
            var lambda = Common.Evaluate(@"
.foo1
eq
   get-value:x:../*/.foo1
   .:OK");
            Assert.Equal(false, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Eq_04()
        {
            var lambda = Common.Evaluate(@"
.foo1:OK
eq
   get-value:x:../*/.foo1
   .");
            Assert.Equal(false, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Eq_05()
        {
            var lambda = Common.Evaluate(@"
.foo1
eq
   get-value:x:../*/.foo1
   .:OK");
            Assert.Equal(false, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Eq_06()
        {
            var lambda = Common.Evaluate(@"
eq
   .
   .");
            Assert.Equal(true, lambda.Children.First().Value);
        }

        [Fact]
        public void Eq_07()
        {
            var lambda = Common.Evaluate(@"
eq
   .:int:5
   .:uint:5");
            Assert.Equal(false, lambda.Children.First().Value);
        }

        [Fact]
        public void Eq_08()
        {
            var lambda = Common.Evaluate(@"
eq
   .:OK
   .:OK");
            Assert.True(lambda.Children.First().Get<bool>());
        }

        [Fact]
        public void Not_01()
        {
            var lambda = Common.Evaluate(@"
.foo1:OK
not
   eq
      get-value:x:../*/.foo1
      .:OK");
            Assert.Equal(false, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void NotThrows()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
.foo1:OK
not
   .throws
   eq
      get-value:x:../*/.foo1
      .:OK"));
        }

        [Fact]
        public async Task Not_01Async()
        {
            var lambda = await Common.EvaluateAsync(@"
.foo1:OK
not
   eq
      get-value:x:../*/.foo1
      .:OK");
            Assert.Equal(false, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Mt_01()
        {
            var lambda = Common.Evaluate(@"
.foo1:A
mt
   get-value:x:../*/.foo1
   .:B");
            Assert.Equal(false, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public async Task Mt_01Async()
        {
            var lambda = await Common.EvaluateAsync(@"
.foo1:A
mt
   get-value:x:../*/.foo1
   .:B");
            Assert.Equal(false, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Mt_02()
        {
            var lambda = Common.Evaluate(@"
.foo1:B
mt
   get-value:x:../*/.foo1
   .:A");
            Assert.Equal(true, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Mt_03()
        {
            var lambda = Common.Evaluate(@"
.foo1
mt
   get-value:x:../*/.foo1
   .:A");
            Assert.Equal(false, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Mt_04()
        {
            var lambda = Common.Evaluate(@"
.foo1:B
mt
   get-value:x:../*/.foo1
   .");
            Assert.Equal(true, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Mt_05()
        {
            var lambda = Common.Evaluate(@"
.foo1
mt
   get-value:x:../*/.foo1
   .");
            Assert.Equal(false, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Mt_06()
        {
            var lambda = Common.Evaluate(@"
.foo1:int:5
mt
   get-value:x:../*/.foo1
   .:string:5");
            Assert.Equal(false, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Lt_01()
        {
            var lambda = Common.Evaluate(@"
.foo1:A
lt
   get-value:x:../*/.foo1
   .:B");
            Assert.Equal(true, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public async Task Lt_01Async()
        {
            var lambda = await Common.EvaluateAsync(@"
.foo1:A
lt
   get-value:x:../*/.foo1
   .:B");
            Assert.Equal(true, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Lt_02()
        {
            var lambda = Common.Evaluate(@"
.foo1:B
lt
   get-value:x:../*/.foo1
   .:A");
            Assert.Equal(false, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Lt_03()
        {
            var lambda = Common.Evaluate(@"
.foo1
lt
   get-value:x:../*/.foo1
   .:A");
            Assert.Equal(true, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Lt_04()
        {
            var lambda = Common.Evaluate(@"
.foo1:B
lt
   get-value:x:../*/.foo1
   .");
            Assert.Equal(false, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Lt_05()
        {
            var lambda = Common.Evaluate(@"
.foo1
lt
   get-value:x:../*/.foo1
   .");
            Assert.Equal(false, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Lt_06()
        {
            var lambda = Common.Evaluate(@"
.foo1:uint:5
lt
   get-value:x:../*/.foo1
   .:int:5");
            Assert.Equal(false, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Lte_01()
        {
            var lambda = Common.Evaluate(@"
.foo1:A
lte
   get-value:x:../*/.foo1
   .:A");
            Assert.Equal(true, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public async Task Lte_01Async()
        {
            var lambda = await Common.EvaluateAsync(@"
.foo1:A
lte
   get-value:x:../*/.foo1
   .:A");
            Assert.Equal(true, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Lte_02()
        {
            var lambda = Common.Evaluate(@"
.foo1:A
lte
   get-value:x:../*/.foo1
   .:B");
            Assert.Equal(true, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Lte_03()
        {
            var lambda = Common.Evaluate(@"
.foo1:B
lte
   get-value:x:../*/.foo1
   .:A");
            Assert.Equal(false, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Lte_04()
        {
            var lambda = Common.Evaluate(@"
.foo1
lte
   get-value:x:../*/.foo1
   .:A");
            Assert.Equal(true, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Lte_05()
        {
            var lambda = Common.Evaluate(@"
.foo1:A
lte
   get-value:x:../*/.foo1
   .");
            Assert.Equal(false, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Lte_06()
        {
            var lambda = Common.Evaluate(@"
.foo1
lte
   get-value:x:../*/.foo1
   .");
            Assert.Equal(true, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Lte_07()
        {
            var lambda = Common.Evaluate(@"
.foo1:int:5
lte
   get-value:x:../*/.foo1
   .:uint:5");
            Assert.Equal(false, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Mte_01()
        {
            var lambda = Common.Evaluate(@"
.foo1:A
mte
   get-value:x:../*/.foo1
   .:A");
            Assert.Equal(true, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public async Task Mte_01Async()
        {
            var lambda = await Common.EvaluateAsync(@"
.foo1:A
mte
   get-value:x:../*/.foo1
   .:A");
            Assert.Equal(true, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Mte_02()
        {
            var lambda = Common.Evaluate(@"
.foo1:A
mte
   get-value:x:../*/.foo1
   .:B");
            Assert.Equal(false, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Mte_03()
        {
            var lambda = Common.Evaluate(@"
.foo1:B
mte
   get-value:x:../*/.foo1
   .:A");
            Assert.Equal(true, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Mte_04()
        {
            var lambda = Common.Evaluate(@"
.foo1
mte
   get-value:x:../*/.foo1
   .:A");
            Assert.Equal(false, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Mte_05()
        {
            var lambda = Common.Evaluate(@"
.foo1:B
mte
   get-value:x:../*/.foo1
   .");
            Assert.Equal(true, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Mte_06()
        {
            var lambda = Common.Evaluate(@"
.foo1
mte
   get-value:x:../*/.foo1
   .");
            Assert.Equal(true, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Mte_07()
        {
            var lambda = Common.Evaluate(@"
.foo1:string:5
mte
   get-value:x:../*/.foo1
   .:int:5");
            Assert.Equal(false, lambda.Children.Skip(1).First().Value);
        }
    }
}
