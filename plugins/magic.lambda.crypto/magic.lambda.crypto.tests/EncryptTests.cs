/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Text;
using Xunit;
using magic.node.extensions;

namespace magic.lambda.crypto.tests
{
   public class EncryptTests
   {
      [Fact]
      public void SignAndEncrypt()
      {
         var lambda = Common.Evaluate(@"

// Recipient's key(s)
crypto.rsa.create-key
   strength:1024

// Sender's key(s).
crypto.rsa.create-key
   strength:1024

// Fingerprint of key used to sign content.
crypto.hash:x:@crypto.rsa.create-key/*/public
   format:raw

// Encrypting content
crypto.encrypt:This is some super secret!
   encryption-key:x:@crypto.rsa.create-key/@crypto.rsa.create-key/*/public
   signing-key:x:@crypto.rsa.create-key/*/private
   signing-key-fingerprint:x:@crypto.hash
");
         var msg = lambda.Children.Skip(3).First().Value as string;
         Assert.NotNull(msg);
         Assert.True(msg.Length > 500 && msg.Length < 700);
      }

      [Fact]
      public void SignAndEncryptNoFingerprint_Throws()
      {
         Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"

// Recipient's key(s)
crypto.rsa.create-key
   strength:1024

// Sender's key(s).
crypto.rsa.create-key
   strength:1024

// Fingerprint of key used to sign content.
crypto.hash:x:@crypto.rsa.create-key/*/public
   format:raw

// Encrypting content
crypto.encrypt:This is some super secret!
   encryption-key:x:@crypto.rsa.create-key/@crypto.rsa.create-key/*/public
   signing-key:x:@crypto.rsa.create-key/*/private
"));
      }

      #pragma warning disable S2699
      [Fact]
      public void SignOnly()
      {
         Common.Evaluate(@"

// Recipient's key(s)
crypto.rsa.create-key
   strength:1024

// Sender's key(s).
crypto.rsa.create-key
   strength:1024

// Fingerprint of key used to sign content.
crypto.hash:x:@crypto.rsa.create-key/*/public
   format:raw

// Encrypting content
crypto.sign:This is some super secret!
   signing-key:x:@crypto.rsa.create-key/*/private
   signing-key-fingerprint:x:@crypto.hash
crypto.verify:x:-
   public-key:x:@crypto.rsa.create-key/*/public
");
      }
      #pragma warning restore S2699

      [Fact]
      public void VerifyFingerprint()
      {
         var lambda = Common.Evaluate(@"

// Recipient's key(s)
crypto.rsa.create-key
   raw:true
   strength:1024

// Sender's key(s).
crypto.rsa.create-key
   strength:1024

// Fingerprint of key used to sign content.
crypto.hash:x:@crypto.rsa.create-key/*/public
   format:raw

// Encrypting content
crypto.encrypt:This is some super secret!
   encryption-key:x:@crypto.rsa.create-key/@crypto.rsa.create-key/*/public
   signing-key:x:@crypto.rsa.create-key/*/private
   signing-key-fingerprint:x:@crypto.hash

// Getting encrypted content's fingerprint.
crypto.get-key:x:@crypto.encrypt

// Getting encryption key's fingerprint.
crypto.hash:x:@crypto.rsa.create-key/@crypto.rsa.create-key/*/public
   format:fingerprint
");
         var msg = lambda.Children.Skip(3).First().Value as string;
         Assert.NotNull(msg);
         Assert.True(msg.Length > 500 && msg.Length < 700);
         Assert.Equal(
         lambda.Children.Skip(4).First().Value,
         lambda.Children.Skip(5).First().Value);
      }

      [Fact]
      public void SignAndEncrypt_Raw()
      {
         var lambda = Common.Evaluate(@"

// Recipient's key(s)
crypto.rsa.create-key
   strength:1024
   raw:true

// Sender's key(s).
crypto.rsa.create-key
   strength:1024
   raw:true

// Fingerprint of key used to sign content.
crypto.hash:x:@crypto.rsa.create-key/*/public
   format:raw

crypto.encrypt:This is some super secret!
   encryption-key:x:@crypto.rsa.create-key/@crypto.rsa.create-key/*/public
   signing-key:x:@crypto.rsa.create-key/*/private
   signing-key-fingerprint:x:@crypto.hash
   raw:true
");
         var msg = lambda.Children.Skip(3).First().Value as byte[];
         Assert.NotNull(msg);
         Assert.True(msg.Length > 300 && msg.Length < 500);
      }

      [Fact]
      public void SignEncryptDecryptAndVerify()
      {
         var lambda = Common.Evaluate(@"

// Receiver's key(s).
crypto.rsa.create-key
   strength:1024

// Sender's key(s).
crypto.rsa.create-key
   strength:1024

// Fingerprint of key used to sign content.
crypto.hash:x:@crypto.rsa.create-key/*/public
   format:raw

// Signing and encrypting.
crypto.encrypt:This is some super secret!
   encryption-key:x:@crypto.rsa.create-key/@crypto.rsa.create-key/*/public
   signing-key:x:@crypto.rsa.create-key/*/private
   signing-key-fingerprint:x:@crypto.hash

// Decrypting and verifying signature.
crypto.decrypt:x:-
   decryption-key:x:@crypto.rsa.create-key/@crypto.rsa.create-key/*/private
   verify-key:x:@crypto.rsa.create-key/*/public
");
         var msg = lambda.Children.Skip(4).First().Value as string;
         Assert.Equal("This is some super secret!", msg);
      }

      [Fact]
      public void SignEncryptDecryptAndVerifyRaw()
      {
         var lambda = Common.Evaluate(@"

// Receiver's key(s).
crypto.rsa.create-key
   strength:1024

// Sender's key(s).
crypto.rsa.create-key
   strength:1024

// Fingerprint of key used to sign content.
crypto.hash:x:@crypto.rsa.create-key/*/public
   format:raw

// Signing and encrypting.
crypto.encrypt:This is some super secret!
   encryption-key:x:@crypto.rsa.create-key/@crypto.rsa.create-key/*/public
   signing-key:x:@crypto.rsa.create-key/*/private
   signing-key-fingerprint:x:@crypto.hash

// Decrypting and verifying signature.
crypto.decrypt:x:-
   raw:true
   decryption-key:x:@crypto.rsa.create-key/@crypto.rsa.create-key/*/private
   verify-key:x:@crypto.rsa.create-key/*/public
");
         var msg = lambda.Children.Skip(4).First().Value as byte[];
         Assert.Equal("This is some super secret!", Encoding.UTF8.GetString(msg));
      }

      [Fact]
      public void SignEncryptDecryptNoVerify()
      {
         var lambda = Common.Evaluate(@"

// Receiver's key(s).
crypto.rsa.create-key
   strength:1024

// Sender's key(s).
crypto.rsa.create-key
   strength:1024

// Fingerprint of key used to sign content.
crypto.hash:x:@crypto.rsa.create-key/*/public
   format:raw

// Signing and encrypting.
crypto.encrypt:This is some super secret!
   encryption-key:x:@crypto.rsa.create-key/@crypto.rsa.create-key/*/public
   signing-key:x:@crypto.rsa.create-key/*/private
   signing-key-fingerprint:x:@crypto.hash

// Decrypting and verifying signature.
crypto.decrypt:x:-
   raw:false
   decryption-key:x:@crypto.rsa.create-key/@crypto.rsa.create-key/*/private
");
         Assert.Equal(typeof(string), lambda.Children.Skip(4).First().Value.GetType());
      }

      [Fact]
      public void SignEncryptDecryptNoVerifyRaw()
      {
         var lambda = Common.Evaluate(@"

// Receiver's key(s).
crypto.rsa.create-key
   strength:1024

// Sender's key(s).
crypto.rsa.create-key
   strength:1024

// Fingerprint of key used to sign content.
crypto.hash:x:@crypto.rsa.create-key/*/public
   format:raw

// Signing and encrypting.
crypto.encrypt:This is some super secret!
   encryption-key:x:@crypto.rsa.create-key/@crypto.rsa.create-key/*/public
   signing-key:x:@crypto.rsa.create-key/*/private
   signing-key-fingerprint:x:@crypto.hash

// Decrypting and verifying signature.
crypto.decrypt:x:-
   raw:true
   decryption-key:x:@crypto.rsa.create-key/@crypto.rsa.create-key/*/private
");
         Assert.Equal(typeof(byte[]), lambda.Children.Skip(4).First().Value.GetType());
      }

      [Fact]
      public void SignEncryptDecryptAndVerify_Raw()
      {
         var lambda = Common.Evaluate(@"

// Receiver's key(s).
crypto.rsa.create-key
   strength:1024

// Sender's key(s).
crypto.rsa.create-key
   strength:1024

// Fingerprint of key used to sign content.
crypto.hash:x:@crypto.rsa.create-key/*/public
   format:raw

// Signing and encrypting.
crypto.encrypt:This is some super secret!
   encryption-key:x:@crypto.rsa.create-key/@crypto.rsa.create-key/*/public
   signing-key:x:@crypto.rsa.create-key/*/private
   signing-key-fingerprint:x:@crypto.hash
   raw:true

// Decrypting and verifying signature.
crypto.decrypt:x:-
   decryption-key:x:@crypto.rsa.create-key/@crypto.rsa.create-key/*/private
   verify-key:x:@crypto.rsa.create-key/*/public
");
         var msg = lambda.Children.Skip(4).First().Value as string;
         Assert.Equal("This is some super secret!", msg);
      }
   }
}
