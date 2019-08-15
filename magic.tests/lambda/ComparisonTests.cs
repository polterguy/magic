/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System.Linq;
using Xunit;

namespace magic.tests.lambda
{
    public class ComparisonTests
    {
        [Fact]
        public void Eq_01()
        {
            var lambda = Common.Evaluate(".foo1:OK\neq\n   get-value:x:../*/.foo1\n   .:OK");
            Assert.Equal(true, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Eq_02()
        {
            var lambda = Common.Evaluate(".foo1:not OK\neq\n   get-value:x:../*/.foo1\n   .:OK");
            Assert.Equal(false, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Not_01()
        {
            var lambda = Common.Evaluate(".foo1:OK\nnot\n   eq\n      get-value:x:../*/.foo1\n      .:OK");
            Assert.Equal(false, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Mt_01()
        {
            var lambda = Common.Evaluate(".foo1:A\nmt\n   get-value:x:../*/.foo1\n   .:B");
            Assert.Equal(false, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Mt_02()
        {
            var lambda = Common.Evaluate(".foo1:B\nmt\n   get-value:x:../*/.foo1\n   .:A");
            Assert.Equal(true, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Lt_01()
        {
            var lambda = Common.Evaluate(".foo1:A\nlt\n   get-value:x:../*/.foo1\n   .:B");
            Assert.Equal(true, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Lt_02()
        {
            var lambda = Common.Evaluate(".foo1:B\nlt\n   get-value:x:../*/.foo1\n   .:A");
            Assert.Equal(false, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Lte_01()
        {
            var lambda = Common.Evaluate(".foo1:A\nlte\n   get-value:x:../*/.foo1\n   .:A");
            Assert.Equal(true, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Lte_02()
        {
            var lambda = Common.Evaluate(".foo1:A\nlte\n   get-value:x:../*/.foo1\n   .:B");
            Assert.Equal(true, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Lte_03()
        {
            var lambda = Common.Evaluate(".foo1:B\nlte\n   get-value:x:../*/.foo1\n   .:A");
            Assert.Equal(false, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Mte_01()
        {
            var lambda = Common.Evaluate(".foo1:A\nmte\n   get-value:x:../*/.foo1\n   .:A");
            Assert.Equal(true, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Mte_02()
        {
            var lambda = Common.Evaluate(".foo1:A\nmte\n   get-value:x:../*/.foo1\n   .:B");
            Assert.Equal(false, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Mte_03()
        {
            var lambda = Common.Evaluate(".foo1:B\nmte\n   get-value:x:../*/.foo1\n   .:A");
            Assert.Equal(true, lambda.Children.Skip(1).First().Value);
        }
    }
}
