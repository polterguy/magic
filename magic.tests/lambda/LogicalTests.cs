/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System.Linq;
using Xunit;

namespace magic.tests.lambda
{
    public class LogicalTests
    {
        [Fact]
        public void And_01()
        {
            var lambda = Common.Evaluate(".foo1:bool:true\nand\n   get-value:x:../*/.foo1\n   .:bool:true");
            Assert.Equal(true, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void And_02()
        {
            var lambda = Common.Evaluate(".foo1:bool:true\nand\n   get-value:x:../*/.foo1\n   .:bool:true\n   .:bool:false");
            Assert.Equal(false, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Or_01()
        {
            var lambda = Common.Evaluate(".foo1:bool:true\nor\n   get-value:x:../*/.foo1\n   .:bool:false");
            Assert.Equal(true, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Or_02()
        {
            var lambda = Common.Evaluate(".foo1:bool:false\nor\n   get-value:x:../*/.foo1\n   .:bool:true\n   .:bool:false");
            Assert.Equal(true, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void Or_03()
        {
            var lambda = Common.Evaluate(".foo1:bool:false\nor\n   get-value:x:../*/.foo1\n   .:bool:false\n   .:bool:false");
            Assert.Equal(false, lambda.Children.Skip(1).First().Value);
        }
    }
}
