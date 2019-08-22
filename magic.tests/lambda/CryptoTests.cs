/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using Xunit;

namespace magic.tests.lambda
{
    public class CryptoTests
    {
        [Fact]
        public void VerifyHashCorrectPassword()
        {
            var lambda = Common.Evaluate(@"crypto.password.hash:foo
crypto.password.verify:foo
   hash:x:@crypto.password.hash");
            Assert.Equal(true, lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void VerifyHashWrongPassword()
        {
            var lambda = Common.Evaluate(@"crypto.password.hash:foo
crypto.password.verify:WRONG
   hash:x:@crypto.password.hash");
            Assert.Equal(false, lambda.Children.Skip(1).First().Value);
        }
    }
}
