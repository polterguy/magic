/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using Xunit;
using magic.node;
using magic.node.extensions;

namespace magic.lambda.tests
{
    /*
     * Characterization tests for how [eval] walks and invokes the nodes of a block, pinning today's behaviour
     * such that its node enumeration can be optimised without changing what gets executed, and in which order.
     */
    public class EvalCharacterizationTests
    {
        static object X(Node lambda) => lambda.Children.First(x => x.Name == ".x").Value;

        [Fact]
        public void NodesStartingWithDot_AndEmptyNames_AreNotInvoked()
        {
            var lambda = Common.Evaluate(@".x
:b
.y
set-value:x:@.x
   .:ok");
            Assert.Equal("ok", X(lambda));
        }

        [Fact]
        public void Nodes_AreInvokedInDocumentOrder()
        {
            var lambda = Common.Evaluate(@".x
set-value:x:@.x
   .:a
set-value:x:@.x
   .:b");
            Assert.Equal("b", X(lambda));
        }

        [Fact]
        public void Return_StopsEvaluationOfSubsequentNodes()
        {
            var lambda = Common.Evaluate(@".x
return:early
set-value:x:@.x
   .:late");
            Assert.Null(X(lambda));
        }

        [Fact]
        public void StatementRemovingALaterSibling_Throws_InvalidOperationException()
        {
            // Documents that the block is enumerated lazily, and that editing it mid-flight is an error.
            Assert.Throws<InvalidOperationException>(() => Common.Evaluate(@".x
remove-nodes:x:../*/set-value
set-value:x:@.x
   .:never"));
        }

        [Fact]
        public void StatementAddingASibling_Throws_InvalidOperationException()
        {
            Assert.Throws<InvalidOperationException>(() => Common.Evaluate(@".x
add:x:..
   .
      set-value:x:@.x
         .:late"));
        }

        [Fact]
        public void ArgumentExpression_WithNoMatch_YieldsNull()
        {
            var lambda = Common.Evaluate(@".x:before
set-value:x:@.x
   get-value:x:@.nothere");
            Assert.Null(X(lambda));
        }

        [Fact]
        public void ArgumentExpression_WithMultipleMatches_Throws()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@".x
.a
   .:1
   .:2
set-value:x:@.x
   get-value:x:@.a/*"));
        }
    }
}
