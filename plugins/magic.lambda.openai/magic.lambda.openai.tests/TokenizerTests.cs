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

        [Fact]
        public void CountsTokensForCl100kModel()
        {
            var node = new Node("openai.tokenize", "Hello world");
            node.Add(new Node("model", "gpt-4"));
            Common.GetSignaler().Signal("openai.tokenize", node);
            Assert.Equal(2, node.Value);
        }

        [Fact]
        public void UnicodeAndLongTextAreCounted()
        {
            var emoji = new Node("openai.tokenize", "\U0001F600 h\u00e9llo w\u00f6rld");
            Common.GetSignaler().Signal("openai.tokenize", emoji);
            var many = new Node("openai.tokenize", string.Concat(System.Linq.Enumerable.Repeat("Hello world. ", 500)));
            Common.GetSignaler().Signal("openai.tokenize", many);
            Assert.True((int)emoji.Value >= 3);
            Assert.True((int)many.Value > 1000);
        }
    }
}
