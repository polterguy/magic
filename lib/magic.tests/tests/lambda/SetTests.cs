/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System.Linq;
using Xunit;

namespace magic.tests.tests.lambda
{
    public class SetTests
    {
        [Fact]
        public void SetWithNull()
        {
            var lambda = Common.Evaluate(".foo1\n   foo2\nremove-node:x:../*/.foo1/*");
            Assert.Empty(lambda.Children.First().Children);
        }

        [Fact]
        public void SetNameWithStatic()
        {
            var lambda = Common.Evaluate(".foo1\nset-name:x:../*/.foo1\n   .:.foo2");
            Assert.Equal(".foo2", lambda.Children.First().Name);
        }

        [Fact]
        public void SetNameWithExpression()
        {
            var lambda = Common.Evaluate(".foo1:.bar1\nset-name:x:../*/.foo1\n   get-value:x:../*/.foo1");
            Assert.Equal(".bar1", lambda.Children.First().Name);
        }

        [Fact]
        public void SetValueWithStatic()
        {
            var lambda = Common.Evaluate(".foo1\nset-value:x:../*/.foo1\n   .:OK");
            Assert.Equal("OK", lambda.Children.First().Value);
        }

        [Fact]
        public void SetValueWithExpression()
        {
            var lambda = Common.Evaluate(".foo1:.bar1\nset-value:x:../*/.foo1\n   get-name:x:../*/.foo1");
            Assert.Equal(".foo1", lambda.Children.First().Value);
        }
    }
}
