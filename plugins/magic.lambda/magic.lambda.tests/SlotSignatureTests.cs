/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using Xunit;
using System.Linq;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.tests
{
    public class SlotSignatureTests
    {
        [Fact]
        public void ReturnsSignatureForSingleSlot()
        {
            var lambda = Common.Evaluate(@"slot.signature:slot.description");
            var result = lambda.Children.First();
            var input = result.Children.First(x => x.Name == "input");
            var output = result.Children.First(x => x.Name == "output");

            Assert.Equal("dynamic-slot-name", input.Children.First(x => x.Name == "kind").GetEx<string>());
            Assert.Equal("Name of the compiled slot to inspect", input.Children.First(x => x.Name == "description").GetEx<string>());
            Assert.True(input.Children.First(x => x.Name == "required").GetEx<bool>());
            Assert.Equal(SlotValueMode.ValueOrExpression.ToString(), input.Children.First(x => x.Name == "mode").GetEx<string>());
            Assert.Equal(SlotReturnsMode.Value.ToString(), output.Children.First(x => x.Name == "mode").GetEx<string>());
            Assert.Equal("slot-description,text", output.Children.First(x => x.Name == "kind").GetEx<string>());
            Assert.Equal("Resolves to the description of the requested slot", output.Children.First(x => x.Name == "description").GetEx<string>());
        }

        [Fact]
        public void ReturnsSignatureForCorrectAlias()
        {
            var lambda = Common.Evaluate(@"slot.signature:execute");
            var result = lambda.Children.First();
            var input = result.Children.First(x => x.Name == "input");
            var output = result.Children.First(x => x.Name == "output");

            Assert.Equal("dynamic-slot-name", input.Children.First(x => x.Name == "kind").GetEx<string>());
            Assert.Equal("Name of the dynamic slot to invoke", input.Children.First(x => x.Name == "description").GetEx<string>());
            Assert.True(input.Children.First(x => x.Name == "required").GetEx<bool>());
            Assert.Equal(SlotValueMode.ValueOrExpression.ToString(), input.Children.First(x => x.Name == "mode").GetEx<string>());
            Assert.Equal(SlotReturnsMode.Both.ToString(), output.Children.First(x => x.Name == "mode").GetEx<string>());
            Assert.Equal("lambda-result", output.Children.First(x => x.Name == "kind").GetEx<string>());
            Assert.Equal("Resolves to the invoked slot's value result and any returned child nodes", output.Children.First(x => x.Name == "description").GetEx<string>());
        }

        [Fact]
        public void OmitsInputWhenSlotDoesNotDocumentInput()
        {
            var lambda = Common.Evaluate(@"slot.signature:foo");
            var result = lambda.Children.First();
            var output = result.Children.First(x => x.Name == "output");

            Assert.DoesNotContain(result.Children, x => x.Name == "input");
            Assert.Equal(SlotReturnsMode.Value.ToString(), output.Children.First(x => x.Name == "mode").GetEx<string>());
            Assert.Equal("string", output.Children.First(x => x.Name == "kind").GetEx<string>());
            Assert.Equal("Resolves to the constant string \"OK\"", output.Children.First(x => x.Name == "description").GetEx<string>());
        }

        [Fact]
        public void OmitsOutputWhenSlotDoesNotDocumentOutput()
        {
            var lambda = Common.Evaluate(@"slot.signature:eval");
            var result = lambda.Children.First();
            var input = result.Children.First(x => x.Name == "input");

            Assert.Equal("lambda-object,lambda-tree", input.Children.First(x => x.Name == "kind").GetEx<string>());
            Assert.Equal("Expression selecting the Hyperlambda nodes to evaluate", input.Children.First(x => x.Name == "description").GetEx<string>());
            Assert.True(input.Children.First(x => x.Name == "required").GetEx<bool>());
            Assert.Equal(SlotValueMode.Expression.ToString(), input.Children.First(x => x.Name == "mode").GetEx<string>());
            Assert.DoesNotContain(result.Children, x => x.Name == "children");
            Assert.DoesNotContain(result.Children, x => x.Name == "output");
        }

        [Fact]
        public void OmitsInputAndOutputWhenSlotDocumentsNeither()
        {
            var lambda = Common.Evaluate(@"slot.signature:.not-visible");
            var result = lambda.Children.First();

            Assert.Empty(result.Children);
        }

        [Fact]
        public void ReturnsConditionalBlockWithoutInputOrExclusiveChildren()
        {
            var lambda = Common.Evaluate(@"slot.signature:if");
            var result = lambda.Children.First();
            var children = result.Children.First(x => x.Name == "children");
            var condition = children.Children.First(x => x.Name == "*");
            var body = children.Children.First(x => x.Name == ".lambda");

            Assert.DoesNotContain(result.Children, x => x.Name == "input");
            Assert.DoesNotContain(condition.Children, x => x.Name == "exclusive-with");
            Assert.Equal(SlotChildRole.Condition.ToString(), condition.Children.First(x => x.Name == "role").GetEx<string>());
            Assert.Equal(SlotChildRole.LambdaBlock.ToString(), body.Children.First(x => x.Name == "role").GetEx<string>());
        }

        [Fact]
        public void ReturnsConvertTypeChild()
        {
            var lambda = Common.Evaluate(@"slot.signature:convert");
            var result = lambda.Children.First();
            var child = result.Children
                .First(x => x.Name == "children")
                .Children
                .First(x => x.Name == "type");

            Assert.Equal("string", child.Children.First(x => x.Name == "type").GetEx<string>());
            Assert.Equal(SlotChildCardinality.ExactlyOne.ToString(), child.Children.First(x => x.Name == "cardinality").GetEx<string>());
            Assert.Equal(SlotChildRole.Option.ToString(), child.Children.First(x => x.Name == "role").GetEx<string>());
        }

        [Fact]
        public void ReturnsApplySignatureAsTemplateExpressionWithLiteralArguments()
        {
            var lambda = Common.Evaluate(@"slot.signature:apply");
            var result = lambda.Children.First();
            var input = result.Children.First(x => x.Name == "input");
            var argument = result.Children
                .First(x => x.Name == "children")
                .Children
                .First(x => x.Name == "*");

            Assert.Equal("template,lambda-tree", input.Children.First(x => x.Name == "kind").GetEx<string>());
            Assert.Equal(SlotValueMode.Expression.ToString(), input.Children.First(x => x.Name == "mode").GetEx<string>());
            Assert.Equal(SlotChildMode.Value.ToString(), argument.Children.First(x => x.Name == "mode").GetEx<string>());
            Assert.Equal(SlotChildRole.Arguments.ToString(), argument.Children.First(x => x.Name == "role").GetEx<string>());
            Assert.Equal(SlotChildProjection.ArgumentBag.ToString(), argument.Children.First(x => x.Name == "projection").GetEx<string>());
        }

        [Theory]
        [InlineData("eq")]
        [InlineData("neq")]
        [InlineData("lt")]
        [InlineData("lte")]
        [InlineData("mt")]
        [InlineData("mte")]
        public void ReturnsComparisonSignature(string slot)
        {
            var lambda = Common.Evaluate($"slot.signature:{slot}");
            var result = lambda.Children.First();
            var operand = result.Children
                .First(x => x.Name == "children")
                .Children
                .First(x => x.Name == "*");
            var output = result.Children.First(x => x.Name == "output");

            Assert.DoesNotContain(result.Children, x => x.Name == "input");
            Assert.Equal(SlotChildCardinality.ExactlyTwo.ToString(), operand.Children.First(x => x.Name == "cardinality").GetEx<string>());
            Assert.Equal(SlotChildRole.OperandPaired.ToString(), operand.Children.First(x => x.Name == "role").GetEx<string>());
            Assert.Equal(SlotChildEvaluation.EvalSelf.ToString(), operand.Children.First(x => x.Name == "evaluation").GetEx<string>());
            Assert.Equal(SlotChildProjection.Value.ToString(), operand.Children.First(x => x.Name == "projection").GetEx<string>());
            Assert.Equal(SlotReturnsMode.Value.ToString(), output.Children.First(x => x.Name == "mode").GetEx<string>());
            Assert.Equal("boolean", output.Children.First(x => x.Name == "kind").GetEx<string>());
        }

        [Fact]
        public void ReturnsGetFirstValueSignatureAsCandidateChildren()
        {
            var lambda = Common.Evaluate(@"slot.signature:get-first-value");
            var result = lambda.Children.First();
            var candidate = result.Children
                .First(x => x.Name == "children")
                .Children
                .First(x => x.Name == "*");
            var output = result.Children.First(x => x.Name == "output");

            Assert.DoesNotContain(result.Children, x => x.Name == "input");
            Assert.Equal(SlotChildCardinality.OneOrMore.ToString(), candidate.Children.First(x => x.Name == "cardinality").GetEx<string>());
            Assert.Equal(SlotChildMode.ExecutableLambda.ToString(), candidate.Children.First(x => x.Name == "mode").GetEx<string>());
            Assert.Equal(SlotChildProjection.Value.ToString(), candidate.Children.First(x => x.Name == "projection").GetEx<string>());
            Assert.Equal(SlotReturnsMode.Value.ToString(), output.Children.First(x => x.Name == "mode").GetEx<string>());
        }

        [Fact]
        public void ReturnsIncludeSignatureWithReturnedNodesWording()
        {
            var lambda = Common.Evaluate(@"slot.signature:include");
            var result = lambda.Children.First();
            var body = result.Children
                .First(x => x.Name == "children")
                .Children
                .First(x => x.Name == "*");
            var output = result.Children.First(x => x.Name == "output");

            Assert.Equal("Executable body evaluated once per selected node; all returned child nodes are included into that selected node", body.Children.First(x => x.Name == "description").GetEx<string>());
            Assert.Equal("Resolves to the matched destination nodes after all returned child nodes have been included", output.Children.First(x => x.Name == "description").GetEx<string>());
        }

        [Fact]
        public void ReturnsMapSignatureWithReturnedResultProjection()
        {
            var lambda = Common.Evaluate(@"slot.signature:map");
            var result = lambda.Children.First();
            var body = result.Children
                .First(x => x.Name == "children")
                .Children
                .First(x => x.Name == "*");
            var output = result.Children.First(x => x.Name == "output");

            Assert.Equal("Mapper body evaluated once per selected node; each returned value becomes a [.] node and returned child nodes are added to the mapped result", body.Children.First(x => x.Name == "description").GetEx<string>());
            Assert.Equal(SlotChildProjection.ReturnedResult.ToString(), body.Children.First(x => x.Name == "projection").GetEx<string>());
            Assert.Equal("Resolves to one mapped output item per selected node, using the value or nodes returned by the child lambda", output.Children.First(x => x.Name == "description").GetEx<string>());
        }

        [Fact]
        public void ReturnsFilterSignatureWithPredicateReturnedResult()
        {
            var lambda = Common.Evaluate(@"slot.signature:filter");
            var result = lambda.Children.First();
            var body = result.Children
                .First(x => x.Name == "children")
                .Children
                .First(x => x.Name == "*");
            var output = result.Children.First(x => x.Name == "output");

            Assert.Equal("Predicate body evaluated once per selected node; the selected node is kept when the body returns true", body.Children.First(x => x.Name == "description").GetEx<string>());
            Assert.Equal(SlotChildRole.Condition.ToString(), body.Children.First(x => x.Name == "role").GetEx<string>());
            Assert.Equal(SlotChildProjection.ReturnedResult.ToString(), body.Children.First(x => x.Name == "projection").GetEx<string>());
            Assert.Equal("Resolves to clones of the selected nodes whose predicate body returns true", output.Children.First(x => x.Name == "description").GetEx<string>());
        }

        [Fact]
        public void ReturnsContextSignatureAsScopedLambdaBlock()
        {
            var lambda = Common.Evaluate(@"slot.signature:context");
            var result = lambda.Children.First();
            var input = result.Children.First(x => x.Name == "input");
            var children = result.Children.First(x => x.Name == "children");
            var value = children.Children.First(x => x.Name == "value");
            var body = children.Children.First(x => x.Name == ".lambda");

            Assert.Equal("Context name to create on the stack while evaluating the lambda block", input.Children.First(x => x.Name == "description").GetEx<string>());
            Assert.Equal("Value stored in the named stack context", value.Children.First(x => x.Name == "description").GetEx<string>());
            Assert.Equal(SlotChildMode.ValueOrExpression.ToString(), value.Children.First(x => x.Name == "mode").GetEx<string>());
            Assert.Equal(SlotChildRole.Option.ToString(), value.Children.First(x => x.Name == "role").GetEx<string>());
            Assert.Equal(SlotChildRole.LambdaBlock.ToString(), body.Children.First(x => x.Name == "role").GetEx<string>());
            Assert.Equal(SlotChildEvaluation.EvalBlock.ToString(), body.Children.First(x => x.Name == "evaluation").GetEx<string>());
        }

        [Fact]
        public void ReturnsSwitchChildConstraints()
        {
            var lambda = Common.Evaluate(@"slot.signature:case");
            var result = lambda.Children.First();
            var parent = result.Children
                .First(x => x.Name == "constraints")
                .Children
                .First(x => x.Name == SlotConstraintKind.ParentMustBe.ToString());

            Assert.Equal("switch", parent.Children.First(x => x.Name == "values").Children.First().GetEx<string>());
        }

        [Fact]
        public void ThrowsForUnknownSlot()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"slot.signature:some.unknown.slot"));
        }
    }
}
