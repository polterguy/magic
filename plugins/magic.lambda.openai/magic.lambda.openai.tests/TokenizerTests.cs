/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using Xunit;
using magic.node;

namespace magic.lambda.openai.tests
{
    public class TokenizerTests
    {
        [Fact]
        public void CountsTokensWithDefaultEncoding()
        {
            var node = new Node("openai.tokenize", "Hello world");
            Common.GetSignaler().Signal("openai.tokenize", node);
            Assert.Equal(2, node.Value);
        }

        [Fact]
        public void EmptyTextIsZeroTokens()
        {
            var node = new Node("openai.tokenize", "");
            Common.GetSignaler().Signal("openai.tokenize", node);
            Assert.Equal(0, node.Value);
        }

        [Fact]
        public void CountsTokensForKnownModel()
        {
            var node = new Node("openai.tokenize", "Hello world");
            node.Add(new Node("model", "gpt-4o"));
            Common.GetSignaler().Signal("openai.tokenize", node);
            Assert.Equal(2, node.Value);
            Assert.Empty(node.Children);
        }

        [Fact]
        public void UnknownModelFallsBackToDefaultEncoding()
        {
            var node = new Node("openai.tokenize", "Hello world");
            node.Add(new Node("model", "some-model-nobody-has-heard-of"));
            Common.GetSignaler().Signal("openai.tokenize", node);
            Assert.Equal(2, node.Value);
        }
    }
}
