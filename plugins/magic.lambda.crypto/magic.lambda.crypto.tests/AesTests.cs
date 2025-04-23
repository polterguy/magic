/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Text;
using Xunit;
using magic.node.extensions;

namespace magic.lambda.crypto.tests
{
    public class AesTests
    {
        [Fact]
        public void EncryptDecrypt128bits()
        {
            var lambda = Common.Evaluate(@"
crypto.aes.encrypt:Howdy, this is cool
   password:This is a test of a passphrase
crypto.aes.decrypt:x:-
   password:This is a test of a passphrase
");
            Assert.NotEqual("Howdy, this is cool", lambda.Children.First().Value);
            Assert.Equal("Howdy, this is cool", lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void EncryptDecrypt256bits()
        {
            var lambda = Common.Evaluate(@"
crypto.aes.encrypt:Howdy, this is cool
   password:This is another password
crypto.aes.decrypt:x:-
   password:This is another password
");
            Assert.True(lambda.Children.First().Value is string);
            Assert.NotEqual("Howdy, this is cool", lambda.Children.First().Value);
            Assert.Equal("Howdy, this is cool", lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void EncryptDecrypt256bits_Raw()
        {
            var lambda = Common.Evaluate(@"
crypto.aes.encrypt:Howdy, this is cool
   password:Howdy world
   raw:true
crypto.aes.decrypt:x:-
   password:Howdy world
   raw:true
");
            Assert.NotEqual("Howdy, this is cool", lambda.Children.First().Value);
            Assert.True(lambda.Children.First().Value is byte[]);
            Assert.Equal(Encoding.UTF8.GetBytes("Howdy, this is cool"), lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void EncryptDecrypt_Throws_01()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
crypto.aes.encrypt:Howdy, this is cool
   password:Jo dude!
crypto.aes.decrypt:x:-
"));
        }

        [Fact]
        public void EncryptDecrypt_Throws_02()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
crypto.aes.encrypt:Howdy, this is cool
"));
        }

        [Fact]
        public void EncryptDecryptDefaultBits()
        {
            var lambda = Common.Evaluate(@"
crypto.aes.encrypt:Howdy, this is cool
   password:Heisann teisann
crypto.aes.decrypt:x:-
   password:Heisann teisann
");
            Assert.NotEqual("Howdy, this is cool", lambda.Children.First().Value);
            Assert.Equal("Howdy, this is cool", lambda.Children.Skip(1).First().Value);
        }
    }
}
