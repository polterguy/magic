/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Text;
using Xunit;
using magic.node.extensions;

namespace magic.lambda.crypto.tests
{
    public class RsaTests
    {
        [Fact]
        public void GenerateKey1024()
        {
            var lambda = Common.Evaluate(@"
crypto.rsa.create-key
   strength:1024");
            var privateLength = lambda.Children.First().Children.First().GetEx<string>().Length;
            var publicLength = lambda.Children.First().Children.Skip(1).First().GetEx<string>().Length;
            Assert.True(privateLength > 800 && privateLength < 900);
            Assert.True(publicLength > 180 && publicLength < 250);
        }

        [Fact]
        public void GenerateKey1024_Raw()
        {
            var lambda = Common.Evaluate(@"
crypto.rsa.create-key
   raw:true
   strength:1024");
            var privateKey = lambda.Children.First().Children.First().Value as byte[];
            var publicKey = lambda.Children.First().Children.Skip(1).First().Value as byte[];
            Assert.True(privateKey.Length > 500 && privateKey.Length < 700);
            Assert.True(publicKey.Length > 100 && publicKey.Length < 250);
        }

        [Fact]
        public void GenerateKey1024ExplicitSeed()
        {
            var lambda = Common.Evaluate(@"
crypto.rsa.create-key
   seed:Thomas Hansen is cool
   strength:1024");
            var privateLength = lambda.Children.First().Children.First().GetEx<string>().Length;
            var publicLength = lambda.Children.First().Children.Skip(1).First().GetEx<string>().Length;
            Assert.True(privateLength > 800 && privateLength < 900);
            Assert.True(publicLength > 180 && publicLength < 250);
        }

        [Fact]
        public void GenerateKey2048()
        {
            var lambda = Common.Evaluate(@"
crypto.rsa.create-key
   strength:2048");
            var privateLength = lambda.Children.First().Children.First().GetEx<string>().Length;
            var publicLength = lambda.Children.First().Children.Skip(1).First().GetEx<string>().Length;
            Assert.True(privateLength > 1550 && privateLength < 1800);
            Assert.True(publicLength > 350 && publicLength < 400);
        }

        [Fact]
        public void GenerateKey1024Twice()
        {
            var lambda = Common.Evaluate(@"
crypto.rsa.create-key
   strength:1024
crypto.rsa.create-key
   strength:1024");
            Assert.NotEqual(
                lambda.Children.First().Children.First().GetEx<string>(),
                lambda.Children.First().Children.Skip(1).First().GetEx<string>());
        }

        [Fact]
        public void SignText()
        {
            var lambda = Common.Evaluate(@"
.data:This is some piece of text that should be signed
crypto.rsa.create-key
   strength:1024
crypto.rsa.sign:x:@.data
   private-key:x:@crypto.rsa.create-key/*/private");
            Assert.NotNull(lambda.Children.Skip(2).First().GetEx<string>());
            Assert.True(lambda.Children.Skip(2).First().Value.GetType() != typeof(Expression));
            Assert.NotEqual(
                "This is some piece of text that should be signed",
                lambda.Children.Skip(2).First().GetEx<string>());
        }

        [Fact]
        public void SignText_Raw()
        {
            var lambda = Common.Evaluate(@"
.data:This is some piece of text that should be signed
crypto.rsa.create-key
   strength:1024
crypto.rsa.sign:x:@.data
   raw:true
   private-key:x:@crypto.rsa.create-key/*/private");
            var sign = lambda.Children.Skip(2).First().Value as byte[];
            Assert.NotNull(sign);
            Assert.True(sign.Length > 70 && sign.Length < 200);
        }

        #pragma warning disable S2699
        [Fact]
        public void SignAndVerifyText_Raw()
        {
            var lambda = Common.Evaluate(@"
.data:This is some piece of text that should be signed
crypto.rsa.create-key
   strength:1024
crypto.rsa.sign:x:@.data
   raw:true
   private-key:x:@crypto.rsa.create-key/*/private
crypto.rsa.verify:x:@.data
   signature:x:@crypto.rsa.sign
   public-key:x:@crypto.rsa.create-key/*/public");
            var sign = lambda.Children.Skip(2).First().Value as byte[];
            Assert.NotNull(sign);
            Assert.True(sign.Length > 70 && sign.Length < 200);
        }
        #pragma warning restore S2699

        [Fact]
        public void SignTextSha512()
        {
            var lambda = Common.Evaluate(@"
.data:This is some piece of text that should be signed
crypto.rsa.create-key
   strength:1024
crypto.rsa.sign:x:@.data
   algorithm:SHA512
   private-key:x:@crypto.rsa.create-key/*/private");
            Assert.NotNull(lambda.Children.Skip(2).First().GetEx<string>());
            Assert.True(lambda.Children.Skip(2).First().Value.GetType() != typeof(Expression));
            Assert.NotEqual(
                "This is some piece of text that should be signed",
                lambda.Children.Skip(1).First().GetEx<string>());
        }

        [Fact]
        public void SignText_Throws()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
.data:This is some piece of text that should be signed
crypto.rsa.create-key
   strength:1024
crypto.rsa.sign:x:@.data
   public-key:x:@crypto.rsa.create-key/*/public"));
        }

        #pragma warning disable S2699
        [Fact]
        public void SignAndVerifyText()
        {
            Common.Evaluate(@"
.data:This is some piece of text that should be signed
crypto.rsa.create-key
   strength:1024
crypto.rsa.sign:x:@.data
   private-key:x:@crypto.rsa.create-key/*/private
crypto.rsa.verify:x:@.data
   public-key:x:@crypto.rsa.create-key/*/public
   signature:x:@crypto.rsa.sign
");
        }
        #pragma warning restore S2699

        #pragma warning disable S2699
        [Fact]
        public void SignAndVerifyTextSha512()
        {
            Common.Evaluate(@"
.data:This is some piece of text that should be signed
crypto.rsa.create-key
   strength:1024
crypto.rsa.sign:x:@.data
   algorithm:SHA512
   private-key:x:@crypto.rsa.create-key/*/private
crypto.rsa.verify:x:@.data
   algorithm:SHA512
   public-key:x:@crypto.rsa.create-key/*/public
   signature:x:@crypto.rsa.sign
");
        }
        #pragma warning restore S2699

        #pragma warning disable S2699
        [Fact]
        public void SignAndVerifyTextSHA1()
        {
            Common.Evaluate(@"
.data:This is some piece of text that should be signed
crypto.rsa.create-key
   strength:1024
crypto.rsa.sign:x:@.data
   algorithm:SHA1
   private-key:x:@crypto.rsa.create-key/*/private
crypto.rsa.verify:x:@.data
   algorithm:SHA1
   public-key:x:@crypto.rsa.create-key/*/public
   signature:x:@crypto.rsa.sign
");
        }
        #pragma warning restore S2699

        #pragma warning disable S2699
        [Fact]
        public void SignAndVerifyTextSHA384()
        {
            Common.Evaluate(@"
.data:This is some piece of text that should be signed
crypto.rsa.create-key
   strength:1024
crypto.rsa.sign:x:@.data
   algorithm:SHA384
   private-key:x:@crypto.rsa.create-key/*/private
crypto.rsa.verify:x:@.data
   algorithm:SHA384
   public-key:x:@crypto.rsa.create-key/*/public
   signature:x:@crypto.rsa.sign
");
        }
        #pragma warning restore S2699

        #pragma warning disable S2699
        [Fact]
        public void SignAndVerifyTextMD5()
        {
            Common.Evaluate(@"
.data:This is some piece of text that should be signed
crypto.rsa.create-key
   strength:1024
crypto.rsa.sign:x:@.data
   algorithm:MD5
   private-key:x:@crypto.rsa.create-key/*/private
crypto.rsa.verify:x:@.data
   algorithm:MD5
   public-key:x:@crypto.rsa.create-key/*/public
   signature:x:@crypto.rsa.sign
");
        }
        #pragma warning restore S2699

        #pragma warning disable S2699
        [Fact]
        public void SignAndVerifyText_Throws_01()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
.data1:This is some piece of text that should be signed
.data2:ThiS is some piece of text that should be signed
crypto.rsa.create-key
   strength:1024
crypto.rsa.sign:x:@.data1
   private-key:x:@crypto.rsa.create-key/*/private
crypto.rsa.verify:x:@.data2
   public-key:x:@crypto.rsa.create-key/*/public
   signature:x:@crypto.rsa.sign
"));
        }
        #pragma warning restore S2699

        [Fact]
        public void EncryptText()
        {
            var lambda = Common.Evaluate(@"
.data:This is some piece of text that should be encrypted
crypto.rsa.create-key
   strength:1024
crypto.rsa.encrypt:x:@.data
   public-key:x:@crypto.rsa.create-key/*/public");
            Assert.NotNull(lambda.Children.Skip(2).First().GetEx<string>());
            Assert.True(lambda.Children.Skip(2).First().Value.GetType() != typeof(Expression));
            Assert.NotEqual(
                "This is some piece of text that should be encrypted",
                lambda.Children.Skip(2).First().GetEx<string>());
        }

        [Fact]
        public void EncryptText_Raw()
        {
            var lambda = Common.Evaluate(@"
.data:This is some piece of text that should be encrypted
crypto.rsa.create-key
   strength:1024
crypto.rsa.encrypt:x:@.data
   raw:true
   public-key:x:@crypto.rsa.create-key/*/public");
            var val = lambda.Children.Skip(2).First().Value as byte[];
            Assert.NotNull(val);
            Assert.True(val.Length > 70 && val.Length < 200);
        }

        [Fact]
        public void EncryptAndDecryptText()
        {
            var lambda = Common.Evaluate(@"
.data:This is some piece of text that should be encrypted
crypto.rsa.create-key
   strength:1024
crypto.rsa.encrypt:x:@.data
   public-key:x:@crypto.rsa.create-key/*/public
crypto.rsa.decrypt:x:@crypto.rsa.encrypt
   private-key:x:@crypto.rsa.create-key/*/private
");
            Assert.Equal(
                "This is some piece of text that should be encrypted",
                lambda.Children.Skip(3).First().GetEx<string>());
        }

        [Fact]
        public void EncryptAndDecryptText_Raw()
        {
            var lambda = Common.Evaluate(@"
.data:This is some piece of text that should be encrypted
crypto.rsa.create-key
   strength:1024
crypto.rsa.encrypt:x:@.data
   public-key:x:@crypto.rsa.create-key/*/public
   raw:true
crypto.rsa.decrypt:x:@crypto.rsa.encrypt
   private-key:x:@crypto.rsa.create-key/*/private
   raw:true
");
            Assert.Equal(
                "This is some piece of text that should be encrypted",
                Encoding.UTF8.GetString(lambda.Children.Skip(3).First().Get<byte[]>()));
            Assert.True(lambda.Children.Skip(2).First().Value is byte[]);
        }
    }
}
