/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Text;
using Xunit;
using magic.node.extensions;
using System.Linq;
using magic.lambda.crypto.lib.rsa;
using Combinations = magic.lambda.crypto.lib.combinations;

namespace magic.lambda.crypto.tests
{
    public class SignerExtraTests
    {
        [Fact]
        public void SignerRejectsFingerprintOfWrongLength()
        {
            var key = new KeyGenerator().Generate(1024);
            Assert.Throws<HyperlambdaException>(() => new Combinations.Signer(key.PrivateKey, new byte[16]));
        }

        [Fact]
        public void SignStringProducesVerifiableSignature()
        {
            var key = new KeyGenerator().Generate(1024);
            var signer = new Combinations.Signer(key.PrivateKey, key.FingerprintRaw);
            var signature = signer.Sign("Hello World");
            var verifier = new Combinations.Verifier(key.PublicKey);
            Assert.Equal("Hello World", Encoding.UTF8.GetString(verifier.Verify(signature)));
        }

        [Fact]
        public void SignBytesToStringProducesBase64()
        {
            var key = new KeyGenerator().Generate(1024);
            var signer = new Combinations.Signer(key.PrivateKey, key.FingerprintRaw);
            var signature = signer.SignToString(Encoding.UTF8.GetBytes("Hello World"));
            var verifier = new Combinations.Verifier(key.PublicKey);
            Assert.Equal("Hello World", verifier.VerifyToString(signature));
        }

        static string Encrypt(string fingerprint)
        {
            var lambda = Common.Evaluate(@"
crypto.rsa.create-key
   strength:1024
crypto.rsa.create-key
   strength:1024
crypto.encrypt:This is some super secret!
   encryption-key:x:@crypto.rsa.create-key/@crypto.rsa.create-key/*/public
   signing-key:x:@crypto.rsa.create-key/*/private
   signing-key-fingerprint:" + fingerprint);
            return lambda.Children.Skip(2).First().Value as string;
        }

        [Fact]
        public void FingerprintAsHexStringIsAccepted()
        {
            var hex = Convert.ToHexString(new byte[32]);
            Assert.NotNull(Encrypt(hex));
        }

        [Fact]
        public void FingerprintAsDashedHexStringIsAccepted()
        {
            var hex = BitConverter.ToString(new byte[32]);
            Assert.NotNull(Encrypt(hex));
        }

        [Fact]
        public void FingerprintOfWrongLengthIsRejected()
        {
            var ex = Assert.Throws<HyperlambdaException>(() => Encrypt(Convert.ToHexString(new byte[16])));
            Assert.Contains("32 bytes", ex.Message);
        }
    }
}
