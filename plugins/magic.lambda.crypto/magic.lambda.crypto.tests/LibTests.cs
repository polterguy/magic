/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Text;
using Xunit;
using Org.BouncyCastle.Crypto;
using magic.lambda.crypto.lib.rsa;
using Aes = magic.lambda.crypto.lib.aes;
using Combinations = magic.lambda.crypto.lib.combinations;
using magic.node.extensions;

namespace magic.lambda.crypto.tests
{
    public class LibTests
    {
        [Fact]
        public void CreateKeyPair_1024()
        {
            var generator = new KeyGenerator();
            var key = generator.Generate(1024);
            Assert.Equal(79, key.Fingerprint.Length);
            Assert.True(key.PrivateKey.Length > 550 && key.PrivateKey.Length < 700);
            Assert.True(key.PublicKey.Length > 100 && key.PublicKey.Length < 200);
        }

        [Fact]
        public void CreateKeyPair_2048()
        {
            var generator = new KeyGenerator();
            var key = generator.Generate(2048);
            Assert.Equal(79, key.Fingerprint.Length);
            Assert.True(key.PrivateKey.Length > 1100 && key.PrivateKey.Length < 1400);
            Assert.True(key.PublicKey.Length > 250 && key.PublicKey.Length < 350);
        }

        [Fact]
        public void EncryptDecrypt_RSA()
        {
            var generator = new KeyGenerator();
            var key = generator.Generate(1024);

            var encrypter = new Encrypter(key.PublicKey);
            var encrypted = encrypter.Encrypt(Encoding.UTF8.GetBytes("Hello World"));

            var decrypter = new Decrypter(key.PrivateKey);
            var decryptedBytes = decrypter.Decrypt(encrypted);
            var decryptedString = decrypter.DecryptToString(encrypted);
            var decryptedFromString = decrypter.Decrypt(Convert.ToBase64String(encrypted));

            Assert.Equal("Hello World", Encoding.UTF8.GetString(decryptedBytes));
            Assert.Equal("Hello World", Encoding.UTF8.GetString(decryptedFromString));
            Assert.Equal("Hello World", decryptedString);
        }

        [Fact]
        public void Sign_RSA()
        {
            var generator = new KeyGenerator();
            var key = generator.Generate(1024);

            var signer = new Signer(key.PrivateKey);
            var signature = signer.Sign(Encoding.UTF8.GetBytes("Hello World"));

            var verifier = new Verifier(key.PublicKey);
            verifier.Verify(Encoding.UTF8.GetBytes("Hello World"), signature);
        }

        [Fact]
        public void Sign_RSA_Throws()
        {
            var generator = new KeyGenerator();
            var key = generator.Generate(1024);

            var signer = new Signer(key.PrivateKey);
            var signature = signer.Sign(Encoding.UTF8.GetBytes("Hello World"));

            var verifier = new Verifier(key.PublicKey);
            Assert.Throws<HyperlambdaException>(() => verifier.Verify(Encoding.UTF8.GetBytes("Hello XWorld"), signature));
        }

        [Fact]
        public void EncryptDecrypt_AES_Bytes()
        {
            var encrypter = new Aes.Encrypter("foo");
            var encrypted = encrypter.Encrypt(Encoding.UTF8.GetBytes("Hello World"));

            var decrypter = new Aes.Decrypter("foo");
            var decrypted = decrypter.Decrypt(encrypted);

            Assert.Equal("Hello World", Encoding.UTF8.GetString(decrypted));
        }

        [Fact]
        public void EncryptDecrypt_AES_String()
        {
            var encrypter = new Aes.Encrypter("foo");
            var encrypted = encrypter.EncryptToString("Hello World");

            var decrypter = new Aes.Decrypter("foo");
            var decrypted = decrypter.DecryptToString(encrypted);

            Assert.Equal("Hello World", decrypted);
        }

        [Fact]
        public void EncryptDecrypt_AES_Throws()
        {
            var encrypter = new Aes.Encrypter("foo");
            var encrypted = encrypter.Encrypt(Encoding.UTF8.GetBytes("Hello World"));

            var decrypter = new Aes.Decrypter("fooX");
            Assert.Throws<InvalidCipherTextException>(() => decrypter.Decrypt(encrypted));
        }

        [Fact]
        public void EncryptDecryptCombinations_Bytes()
        {
            var generator = new KeyGenerator();
            var key = generator.Generate(1024);

            var encrypter = new Combinations.Encrypter(key.PublicKey);
            var encrypted = encrypter.Encrypt(Encoding.UTF8.GetBytes("Hello world"));

            var decrypter = new Combinations.Decrypter(key.PrivateKey);
            var decrypted = decrypter.Decrypt(encrypted);

            Assert.Equal("Hello world", Encoding.UTF8.GetString(decrypted));
        }

        [Fact]
        public void EncryptDecryptCombinations_String()
        {
            var generator = new KeyGenerator();
            var key = generator.Generate(1024);

            var encrypter = new Combinations.Encrypter(key.PublicKey);
            var encrypted = encrypter.EncryptToString(Encoding.UTF8.GetBytes("Hello world"));

            var decrypter = new Combinations.Decrypter(key.PrivateKey);
            var decrypted = decrypter.DecryptToString(encrypted);

            Assert.Equal("Hello world", decrypted);
        }

        [Fact]
        public void SignVerifyCombinations_Bytes()
        {
            var generator = new KeyGenerator();
            var key = generator.Generate(1024);

            var signer = new Combinations.Signer(key.PrivateKey, key.FingerprintRaw);
            var signature = signer.Sign(Encoding.UTF8.GetBytes("Hello World"));

            var verifier = new Combinations.Verifier(key.PublicKey);
            verifier.Verify(signature);
        }

        [Fact]
        public void SignVerifyCombinations_String()
        {
            var generator = new KeyGenerator();
            var key = generator.Generate(1024);

            var signer = new Combinations.Signer(key.PrivateKey, key.FingerprintRaw);
            var signature = signer.SignToString("Hello World");

            var verifier = new Combinations.Verifier(key.PublicKey);
            var message = verifier.VerifyToString(signature);
            Assert.Equal("Hello World", message);
        }
    }
}