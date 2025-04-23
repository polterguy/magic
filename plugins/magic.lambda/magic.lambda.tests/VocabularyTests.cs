/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using Xunit;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.tests
{
    public class VocabularyTests
    {
        [Slot(Name = ".not-visible")]
        public class NotVisibleSlot : ISlot
        {
            public void Signal(ISignaler signaler, Node input)
            {
            }
        }

        [Fact]
        public void VocabularyWithoutFilter()
        {
            var lambda = Common.Evaluate(@"vocabulary");
            Assert.True(lambda.Children.First().Children.Count() > 20);
            Assert.Empty(lambda.Children.First().Children.Where(x => x.Name == ".not-visible"));
        }

        [Fact]
        public void VocabularyWithFilter()
        {
            var lambda = Common.Evaluate(@"vocabulary:whil");
            Assert.True(lambda.Children.First().Children.Any());
            foreach (var idx in lambda.Children.First().Children.Select(x => x.GetEx<string>()))
            {
                Assert.StartsWith("while", idx);
            }
        }
    }
}
