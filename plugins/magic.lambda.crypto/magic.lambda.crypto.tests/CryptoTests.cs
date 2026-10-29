/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using Xunit;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.crypto.tests
{
    public class CryptoTests
    {
        [Fact]
        public void VerifyHashCorrectPassword()
        {
            var lambda = Common.Evaluate(@"crypto.password.hash:foo
crypto.password.verify:foo
   hash:x:@crypto.password.hash");
            Assert.True((bool)lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void VerifyHashWrongPassword()
        {
            var lambda = Common.Evaluate(@"crypto.password.hash:foo
crypto.password.verify:WRONG
   hash:x:@crypto.password.hash");
            Assert.False((bool)lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void VerifyHashPasswordThrows()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"crypto.password.hash:foo
crypto.password.verify:WRONG"));
        }

        [Fact]
        public void HashDefaultAlgo()
        {
            var lambda = Common.Evaluate(@"crypto.hash:some-input-string");
            Assert.Equal(
                "D70BEB83530DC0C965FE075C57EB706572A05D5D3D3E117C45FE8236900E80DD",
                lambda.Children.First().Get<string>().ToUpperInvariant());
        }

        [Fact]
        public void CreateFingerprint()
        {
            var lambda = Common.Evaluate(@"crypto.fingerprint:c29tZS1pbnB1dC1zdHJpbmc=");
            Assert.Equal(
                "d70b-eb83-530d-c0c9-65fe-075c-57eb-7065-72a0-5d5d-3d3e-117c-45fe-8236-900e-80dd",
                lambda.Children.First().Get<string>());
        }

        [Fact]
        public void FingerprintSignatureDocumentsBase64Input()
        {
            var lambda = Common.Evaluate(@"slot.signature:crypto.fingerprint");
            var input = lambda.Children.First().Children.First(x => x.Name == "input");
            var output = lambda.Children.First().Children.First(x => x.Name == "output");

            Assert.Equal("Base64 encoded content or raw byte[] content to fingerprint", input.Children.First(x => x.Name == "description").GetEx<string>());
            Assert.Equal(SlotValueMode.ValueOrExpression.ToString(), input.Children.First(x => x.Name == "mode").GetEx<string>());
            Assert.Equal("Resolves to the SHA256 hash of the supplied content formatted as a fingerprint", output.Children.First(x => x.Name == "description").GetEx<string>());
        }

        [Fact]
        public void HashSha256()
        {
            var lambda = Common.Evaluate(@"
crypto.hash:some-input-string
   algorithm:SHA256");
            Assert.Equal(
                "D70BEB83530DC0C965FE075C57EB706572A05D5D3D3E117C45FE8236900E80DD",
                lambda.Children.First().Get<string>().ToUpperInvariant());

            // Asserting hash is lowers.
            Assert.NotEqual(
                "D70BEB83530DC0C965FE075C57EB706572A05D5D3D3E117C45FE8236900E80DD",
                lambda.Children.First().Get<string>());
        }

        [Fact]
        public void HashSha512()
        {
            var lambda = Common.Evaluate(@"
crypto.hash:some-input-string
   algorithm:SHA512");
            Assert.Equal(
                "BED2004780419D966327DA73A98BE04CB474AA36C92FD8AF970E49EA9AA05C5F68938E486E20326059CB0290472DEFFD03939C18CAC9364F29C69105CD4130D3",
                lambda.Children.First().Get<string>().ToUpperInvariant());
        }

        [Fact]
        public void HashSha384()
        {
            var lambda = Common.Evaluate(@"
crypto.hash:some-input-string
   algorithm:SHA384");
            Assert.Equal(
                "F0DBFDF28BB9DF25715EB129E2270366E3E73FB509AF1E196269450898AA38820D645DE072EF4434AF3A097A693C178B",
                lambda.Children.First().Get<string>().ToUpperInvariant());
        }

        [Fact]
        public void HashShaThrows()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
crypto.hash:some-input-string
   algorithm:Non-Existing"));
        }

        [Fact]
        public void RandomCharacters()
        {
            var lambda = Common.Evaluate(@"
crypto.random
   min:50
   max:100");
            Assert.NotNull(lambda.Children.First().Value);
            Assert.True(lambda.Children.First().Value.GetType() == typeof(string));
            Assert.True(lambda.Children.First().Get<string>().Length >= 50);
            Assert.True(lambda.Children.First().Get<string>().Length <= 100);
        }

        [Fact]
        public void RandomCharacters_MaximumLength()
        {
            var lambda = Common.Evaluate(@"
crypto.random
   min:4096
   max:4096");
            Assert.Equal(4096, lambda.Children.First().Get<string>().Length);
        }

        [Fact]
        public void RandomCharacters_OverMaximumLength_Throws()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
crypto.random
   min:4097
   max:4097"));
        }

        [Fact]
        public void RandomBytes_OverMaximumLength_Throws()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
crypto.random
   raw:true
   min:4097
   max:4097"));
        }

        [Fact]
        public void RandomInvalidRange_Throws()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
crypto.random
   min:-1
   max:1"));
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
crypto.random
   min:10
   max:9"));
        }

        [Fact]
        public void Seed()
        {
            var lambda = Common.Evaluate(@"crypto.seed:qwertyuiop");
            Assert.Null(lambda.Children.First().Value);
        }

        [Fact]
        public void Seed_Throws()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"crypto.seed"));
        }

        [Fact]
        public void RandomBytes()
        {
            var lambda = Common.Evaluate(@"
crypto.random
   raw:true
   min:32
   max:32");
            Assert.NotNull(lambda.Children.First().Value);
            Assert.Equal(32, lambda.Children.First().Get<byte[]>().Length);
        }

        [Fact]
        public void RandomCharacters_DefaultLength()
        {
            var lambda = Common.Evaluate(@"crypto.random");
            Assert.NotNull(lambda.Children.First().Value);
            Assert.True(lambda.Children.First().Get<string>().Length >= 10);
            Assert.True(lambda.Children.First().Get<string>().Length <= 20);
        }
    }
}
