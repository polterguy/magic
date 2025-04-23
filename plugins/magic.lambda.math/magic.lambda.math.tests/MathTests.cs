/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Threading.Tasks;
using Xunit;
using magic.node.extensions;

namespace magic.lambda.math.tests
{
    public class MathTests
    {
        [Fact]
        public void Add()
        {
            var lambda = Common.Evaluate(@"

math.add
   :int:5
   :int:7");
            Assert.Equal(12, lambda.Children.First().Value);
        }

        [Fact]
        public void AddNullExpressionThrows()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
.foo
math.add:x:@.foo
   :int:7"));
        }

        [Fact]
        public void AddNoBaseThrows()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
math.add
"));
        }

        [Fact]
        public async Task AddAsync()
        {
            var lambda = await Common.EvaluateAsync(@"

math.add
   :int:5
   :int:7");
            Assert.Equal(12, lambda.Children.First().Value);
        }

        [Fact]
        public void AddWithBase()
        {
            var lambda = Common.Evaluate(@"

math.add:int:2
   .:int:5
   .:int:7");
            Assert.Equal(14, lambda.Children.First().Value);
        }

        [Fact]
        public void AddExpression()
        {
            var lambda = Common.Evaluate(@"

math.add
   .:x:./+
   .:int:7
.:int:5");
            Assert.Equal(12, lambda.Children.First().Value);
        }

        [Fact]
        public void AddExpressionWithBase()
        {
            var lambda = Common.Evaluate(@"

math.add:x:+
   .:int:7
.:int:5");
            Assert.Equal(12, lambda.Children.First().Value);
        }

        [Fact]
        public void Subtract()
        {
            var lambda = Common.Evaluate(@"

math.subtract
   .:int:8
   .:int:5
   .:int:1");
            Assert.Equal(2, lambda.Children.First().Value);
        }

        [Fact]
        public async Task SubtractAsync()
        {
            var lambda = await Common.EvaluateAsync(@"

math.subtract
   .:int:8
   .:int:5
   .:int:1");
            Assert.Equal(2, lambda.Children.First().Value);
        }

        [Fact]
        public void Multiply()
        {
            var lambda = Common.Evaluate(@"

math.multiply
   :int:2
   :int:2
   :int:3");
            Assert.Equal(12, lambda.Children.First().Value);
        }

        [Fact]
        public async Task MultiplyAsync()
        {
            var lambda = await Common.EvaluateAsync(@"

math.multiply
   :int:2
   :int:2
   :int:3");
            Assert.Equal(12, lambda.Children.First().Value);
        }

        [Fact]
        public void Modulo()
        {
            var lambda = Common.Evaluate(@"

math.modulo:int:7
   :int:5");
            Assert.Equal(2, lambda.Children.First().Value);
        }

        [Fact]
        public async Task ModuloAsync()
        {
            var lambda = await Common.EvaluateAsync(@"

math.modulo:int:7
   :int:5");
            Assert.Equal(2, lambda.Children.First().Value);
        }

        [Fact]
        public void Divide()
        {
            var lambda = Common.Evaluate(@"

math.divide
   :int:12
   :int:2");
            Assert.Equal(6, lambda.Children.First().Value);
        }

        [Fact]
        public async Task DivideAsync()
        {
            var lambda = await Common.EvaluateAsync(@"

math.divide
   :int:12
   :int:2");
            Assert.Equal(6, lambda.Children.First().Value);
        }

        [Fact]
        public void Increment()
        {
            var lambda = Common.Evaluate(@"
.foo:int:4
math.increment:x:-");
            Assert.Equal(5, lambda.Children.First().Value);
        }

        [Fact]
        public void IncrementStep()
        {
            var lambda = Common.Evaluate(@"
.foo:int:4
math.increment:x:-
   .:int:2");
            Assert.Equal(6, lambda.Children.First().Value);
        }

        [Fact]
        public async Task IncrementAsync()
        {
            var lambda = await Common.EvaluateAsync(@"
.foo:int:4
math.increment:x:-");
            Assert.Equal(5, lambda.Children.First().Value);
        }

        [Fact]
        public void Decrement()
        {
            var lambda = Common.Evaluate(@"
.foo:int:5
math.decrement:x:-");
            Assert.Equal(4, lambda.Children.First().Value);
        }

        [Fact]
        public void DecrementStep()
        {
            var lambda = Common.Evaluate(@"
.foo:int:5
math.decrement:x:-
   .:int:2");
            Assert.Equal(3, lambda.Children.First().Value);
        }

        [Fact]
        public async Task DecrementAsync()
        {
            var lambda = await Common.EvaluateAsync(@"
.foo:int:5
math.decrement:x:-");
            Assert.Equal(4, lambda.Children.First().Value);
        }

        [Fact]
        public void IncrementMultipleNodes()
        {
            var lambda = Common.Evaluate(@"
.foo:int:4
.foo:int:4
math.increment:x:../*/.foo");
            Assert.Equal(5, lambda.Children.First().Value);
            Assert.Equal(5, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void IncrementWithStep()
        {
            var lambda = Common.Evaluate(@"
.foo:int:4
math.increment:x:-
   :int:3");
            Assert.Equal(7, lambda.Children.First().Value);
        }

        [Fact]
        public void Max_01()
        {
            var lambda = Common.Evaluate(@"
math.max
   :int:5
   :int:7");
            Assert.Equal(7, lambda.Children.First().Value);
        }

        [Fact]
        public void Max_02()
        {
            var lambda = Common.Evaluate(@"
math.max
   :int:7
   :int:5");
            Assert.Equal(7, lambda.Children.First().Value);
        }

        [Fact]
        public void Max_03()
        {
            var lambda = Common.Evaluate(@"
.foo
   foo1:int:10
   foo2:int:11
math.max:x:@.foo/*/foo1
   get-value:x:@.foo/*/foo2");
            Assert.Equal(11, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Min_01()
        {
            var lambda = Common.Evaluate(@"
math.min
   :int:5
   :int:7");
            Assert.Equal(5, lambda.Children.First().Value);
        }

        [Fact]
        public void Min_02()
        {
            var lambda = Common.Evaluate(@"
math.min
   :int:7
   :int:5");
            Assert.Equal(5, lambda.Children.First().Value);
        }

        [Fact]
        public void Min_03()
        {
            var lambda = Common.Evaluate(@"
.foo
   foo1:int:10
   foo2:int:11
math.min:x:@.foo/*/foo1
   get-value:x:@.foo/*/foo2");
            Assert.Equal(10, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Dot_01()
        {
            var lambda = Common.Evaluate(@"
.list1
   .:double:0.5
   .:double:0.7
   .:double:0.1
.list2
   .:double:0.56
   .:double:0.89
   .:double:0.33
math.dot
   get-nodes:x:@.list1/*
   get-nodes:x:@.list2/*");
            Assert.Equal(0.936D, lambda.Children.Skip(2).First().Value);
        }
    }
}
