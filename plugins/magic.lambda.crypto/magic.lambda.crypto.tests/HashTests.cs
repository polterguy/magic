/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Xunit;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.crypto.tests
{
    /// <summary>
    /// What [io.stream.open-file] is in the real application, which is what [crypto.hash] opens files through.
    /// </summary>
    [Slot(Name = "io.stream.open-file")]
    public class TestOpenFile : ISlotAsync
    {
        public Task SignalAsync(ISignaler signaler, Node input)
        {
            input.Value = File.OpenRead(input.GetEx<string>());
            return Task.CompletedTask;
        }
    }

    public class HashTests
    {
        static readonly string MD5 = "900150983cd24fb0d6963f7d28e17f72";
        static readonly string SHA1 = "a9993e364706816aba3e25717850c26c9cd0d89d";
        static readonly string SHA256 = "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";
        static readonly string SHA384 = "cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7";
        static readonly string SHA512 = "ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f";
        static readonly Dictionary<string, string> Expected = new()
        {
            ["MD5"] = MD5,
            ["SHA1"] = SHA1,
            ["SHA256"] = SHA256,
            ["SHA384"] = SHA384,
            ["SHA512"] = SHA512,
        };
        static readonly string SHA1_FINGERPRINT = "a999-3e36-4706-816a-ba3e-2571-7850-c26c-9cd0-d89d";

        [Theory]
        [InlineData("crypto.hash.md5", "MD5")]
        [InlineData("crypto.hash.sha1", "SHA1")]
        [InlineData("crypto.hash.sha256", "SHA256")]
        [InlineData("crypto.hash.sha384", "SHA384")]
        [InlineData("crypto.hash.sha512", "SHA512")]
        public void EachAlgorithmHasItsOwnSlot(string slot, string expected)
        {
            var lambda = Common.Evaluate(slot + ":abc");
            Assert.Equal(Expected[expected], lambda.Children.First().Value);
        }

        [Theory]
        [InlineData("md5", "MD5")]
        [InlineData("sha1", "SHA1")]
        [InlineData("SHA384", "SHA384")]
        [InlineData("sha512", "SHA512")]
        public void AlgorithmCanBeAnArgument(string algorithm, string expected)
        {
            var lambda = Common.Evaluate("crypto.hash:abc\n   algorithm:" + algorithm);
            Assert.Equal(Expected[expected], lambda.Children.First().Value);
            lambda = Common.Evaluate("crypto.hash:abc\n   algo:" + algorithm);
            Assert.Equal(Expected[expected], lambda.Children.First().Value);
        }

        [Fact]
        public void DefaultsToSha256()
        {
            Assert.Equal(SHA256, Common.Evaluate("crypto.hash:abc").Children.First().Value);
        }

        [Fact]
        public void FormatRawReturnsTheBytes()
        {
            var value = (byte[])Common.Evaluate("crypto.hash.sha1:abc\n   format:raw").Children.First().Value;
            Assert.Equal(SHA1, Convert.ToHexStringLower(value));
        }

        [Fact]
        public void FormatFingerprintGroupsTwoBytesAtATime()
        {
            Assert.Equal(SHA1_FINGERPRINT, Common.Evaluate("crypto.hash.sha1:abc\n   format:fingerprint").Children.First().Value);
        }

        [Fact]
        public void UnknownFormatThrows()
        {
            var ex = Assert.Throws<HyperlambdaException>(() => Common.Evaluate("crypto.hash:abc\n   format:nope"));
            Assert.Contains("nope", ex.Message);
        }

        [Fact]
        public void UnknownAlgorithmThrows()
        {
            var ex = Assert.Throws<HyperlambdaException>(() => Common.Evaluate("crypto.hash:abc\n   algorithm:whirlpool"));
            Assert.Contains("whirlpool", ex.Message);
        }

        [Fact]
        public void NoContentAndNoFilenameThrows()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate("crypto.hash"));
        }

        [Fact]
        public void BytesAreHashedAsTheyAre()
        {
            var lambda = Common.Evaluate(".data:abc\nconvert:x:@.data\n   type:bytes\ncrypto.hash.sha1:x:@convert");
            Assert.Equal(SHA1, lambda.Children.Last().Value);
        }

        [Fact]
        public void FilesAreHashedThroughTheStreamSlot()
        {
            var file = Path.Combine(Path.GetTempPath(), "magic-hash-" + Guid.NewGuid().ToString("N") + ".txt");
            File.WriteAllText(file, "abc");
            try
            {
                var lambda = Common.Evaluate("crypto.hash.sha256\n   filename:" + file.Replace("\\", "/"));
                Assert.Equal(SHA256, lambda.Children.First().Value);
            }
            finally
            {
                File.Delete(file);
            }
        }
    }
}
