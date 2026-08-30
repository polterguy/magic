/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Threading.Tasks;
using Xunit;
using magic.node.extensions;
using magic.signals.contracts;

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

        [Theory]
        [InlineData("math.add")]
        [InlineData("math.subtract")]
        [InlineData("math.multiply")]
        [InlineData("math.divide")]
        [InlineData("math.modulo")]
        [InlineData("math.max")]
        [InlineData("math.min")]
        public void ArithmeticSignaturesDocumentChildOperandsOnly(string slotName)
        {
            var lambda = Common.Evaluate($"slot.signature:{slotName}");
            var signature = lambda.Children.First();
            var children = signature.Children.First(x => x.Name == "children");
            var operand = children.Children.First();

            Assert.DoesNotContain(signature.Children, x => x.Name == "input");
            Assert.Equal("*", operand.Name);
            Assert.Equal(SlotChildCardinality.TwoOrMore.ToString(), operand.Children.First(x => x.Name == "cardinality").GetEx<string>());
            Assert.Equal(SlotChildMode.ExecutableLambda.ToString(), operand.Children.First(x => x.Name == "mode").GetEx<string>());
            Assert.Equal(SlotChildRole.OperandPaired.ToString(), operand.Children.First(x => x.Name == "role").GetEx<string>());
            Assert.Equal(SlotChildEvaluation.EvalSelf.ToString(), operand.Children.First(x => x.Name == "evaluation").GetEx<string>());
            Assert.Equal(SlotChildProjection.Value.ToString(), operand.Children.First(x => x.Name == "projection").GetEx<string>());
        }

        [Fact]
        public void DotSignatureDocumentsExactlyTwoVectorOperands()
        {
            var lambda = Common.Evaluate("slot.signature:math.dot");
            var operand = lambda.Children.First().Children.First(x => x.Name == "children").Children.First();

            Assert.Equal("*", operand.Name);
            Assert.Equal(SlotChildCardinality.ExactlyTwo.ToString(), operand.Children.First(x => x.Name == "cardinality").GetEx<string>());
            Assert.Equal(SlotChildProjection.Children.ToString(), operand.Children.First(x => x.Name == "projection").GetEx<string>());
        }

        [Theory]
        [InlineData("math.increment")]
        [InlineData("math.decrement")]
        public void IncrementDecrementSignaturesDocumentOptionalStep(string slotName)
        {
            var lambda = Common.Evaluate($"slot.signature:{slotName}");
            var signature = lambda.Children.First();
            var children = signature.Children.First(x => x.Name == "children");
            var step = children.Children.First();

            Assert.Equal("step", step.Name);
            Assert.Equal("number", step.Children.First(x => x.Name == "type").GetEx<string>());
            Assert.False(step.Children.First(x => x.Name == "required").GetEx<bool>());
            Assert.Equal(SlotChildCardinality.ZeroOrOne.ToString(), step.Children.First(x => x.Name == "cardinality").GetEx<string>());
            Assert.Equal("1", step.Children.First(x => x.Name == "default").GetEx<string>());
            Assert.Equal(SlotChildProjection.Value.ToString(), step.Children.First(x => x.Name == "projection").GetEx<string>());
        }

        [Fact]
        public void RandomSignatureDocumentsNamedBounds()
        {
            var lambda = Common.Evaluate("slot.signature:math.random");
            var signature = lambda.Children.First();
            var children = signature.Children.First(x => x.Name == "children");
            var min = children.Children.First();
            var max = children.Children.Skip(1).First();
            var requires = signature.Children
                .First(x => x.Name == "constraints")
                .Children
                .First(x => x.Name == SlotConstraintKind.Requires.ToString());

            Assert.Equal("min", min.Name);
            Assert.Equal("max", max.Name);
            Assert.Equal("int", min.Children.First(x => x.Name == "type").GetEx<string>());
            Assert.Equal("int", max.Children.First(x => x.Name == "type").GetEx<string>());
            Assert.False(min.Children.First(x => x.Name == "required").GetEx<bool>());
            Assert.False(max.Children.First(x => x.Name == "required").GetEx<bool>());
            Assert.Equal("min", requires.Children.First(x => x.Name == "target").GetEx<string>());
            Assert.Equal("max", requires.Children.First(x => x.Name == "values").Children.First().GetEx<string>());
        }
    }
}
