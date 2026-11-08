/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System;
using System.IO;
using System.Linq;
using System.Reflection;
using Xunit;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.signals.services;
using magic.lambda.hyperlambda;

namespace magic.library.tests
{
    /*
     * Tests of [hyperlambda.verify-slots], against every slot Magic ships with, modelled on idioms found
     * in the Hyperlambda that ships with Magic. Each idiom has a snippet that must be accepted, and one
     * that must be rejected.
     */
    public class VerifySlotsConceptTests
    {
        static readonly Lazy<VerifySlots> Verifier = new(CreateVerifier);

        #region [ -- A slot that only reads some of its children -- ]

        [Fact]
        public void ThrowWithTheOptionsItReadsIsAccepted()
        {
            AssertValid(@"throw:Could not invoke endpoint
   status:int:500
   public:bool:true
   field:email");
        }

        [Fact]
        public void ThrowWithChildrenNothingReadsIsRejected()
        {
            var result = Verify(@"throw:Could not invoke endpoint
   status:int:500
   url:x:@.url
   response:x:@.response");
            AssertInvalidInvocation(result, "throw", "[url]");
            AssertInvalidInvocation(result, "throw", "[response]");
        }

        [Fact]
        public void ThrowWithOnlyAMessageIsAccepted()
        {
            AssertValid("throw:Something went wrong");
        }

        #endregion

        #region [ -- An option name that is misspelled -- ]

        [Theory]
        [InlineData(
            "sockets.signal:x:@.session\n   role:root\n   args\n      type:download_file",
            "role",
            "sockets.signal:x:@.session\n   roles:root\n   args\n      type:download_file")]
        [InlineData(
            "math.add\n   date.now\n   time\n      expires:x:@.days",
            "expires",
            "math.add\n   date.now\n   time\n      days:x:@.days")]
        [InlineData(
            "data.connect:[generic|magic]\n   data.create\n      type:sqlite\n      table:foo\n      values\n         a:b",
            "type",
            "data.connect:[generic|magic]\n   data.create\n      database-type:sqlite\n      table:foo\n      values\n         a:b")]
        [InlineData(
            "io.file.list-recursively:/foo/\n   show-hidden:true",
            "show-hidden",
            "io.file.list-recursively:/foo/\n   display-hidden:true")]
        [InlineData(
            "hyper2lambda:x:@.code\n   comment:bool:true",
            "comment",
            "hyper2lambda:x:@.code\n   comments:bool:true")]
        public void MisspelledOptionIsRejectedAndTheCorrectionAccepted(string wrong, string badChild, string right)
        {
            var result = Verify(wrong);
            Assert.False(result.Get<bool>());
            Assert.Contains(result.Children, x => x.Get<string>().Contains($"[{badChild}]", StringComparison.Ordinal));
            AssertValid(right);
        }

        #endregion

        #region [ -- An option or input form that the runtime accepts -- ]

        [Theory]
        [InlineData("data.read\n   table:contacts\n   columns\n      name\n      created\n   order:created\n   direction:desc\n   limit:10")]
        [InlineData(".loc:int:0\nmath.increment:x:@.loc\n   get-count:x:@.files/**")]
        [InlineData("image.chart:bars\n   filename:/bars.png\n   width:400\n   height:300\n   bars\n      a:1\n      b:2")]
        [InlineData("log.info\n   .:Hello\n   .:-world")]
        [InlineData("log.info\n   lambda2hyper:x:@.result")]
        [InlineData("lambda2json\n   foo:bar")]
        [InlineData("lambda2xml\n   foo\n      #text:bar")]
        [InlineData("lambda2hyper\n   foo:bar")]
        [InlineData("crypto.verify:x:@.signature\n   public-key:x:@.key")]
        [InlineData("crypto.decrypt:x:@.package\n   decryption-key:x:@.key\n   verify-key:x:@.publicKey")]
        [InlineData("crypto.decrypt:x:@.package\n   decryption-key:x:@.key")]
        [InlineData("mail.smtp.send\n   server\n      host:smtp.example.com\n      port:int:587\n   message\n      subject:Hi")]
        [InlineData("cache.list\n   filter:foo")]
        [InlineData("crypto.hash:x:@.text\n   algo:sha1")]
        public void OptionOrInputFormTheRuntimeAcceptsIsAccepted(string snippet)
        {
            AssertValid(snippet);
        }

        [Theory]
        [InlineData("data.read\n   table:contacts\n   zz-bogus-child:x")]
        [InlineData("image.chart:scatter\n   zz-bogus-child:x")]
        [InlineData("mail.smtp.send\n   zz-bogus-child:x")]
        [InlineData("cache.list\n   zz-bogus-child:x")]
        [InlineData("crypto.hash:x:@.text\n   zz-bogus-child:x")]
        [InlineData("crypto.rsa.sign:x:@.message\n   zz-bogus-child:x")]
        [InlineData("crypto.rsa.sign:x:@.message\n   algorithm:sha256\n   private-key:x:@.key")]
        [InlineData("crypto.verify:x:@.signature\n   verification-key:x:@.key")]
        [InlineData("image.chart:bars\n   ticks:x\n   color:red")]
        public void OptionNothingReadsIsRejected(string snippet)
        {
            Assert.False(Verify(snippet).Get<bool>());
        }

        #endregion

        #region [ -- Private helpers -- ]

        /*
         * Creates a verifier that knows about every slot in every Magic assembly.
         */
        static VerifySlots CreateVerifier()
        {
            var types = Directory.GetFiles(AppContext.BaseDirectory, "magic.*.dll")
                .Select(Assembly.LoadFrom)
                .SelectMany(x => x.GetTypes())
                .Where(x => (typeof(ISlot).IsAssignableFrom(x) || typeof(ISlotAsync).IsAssignableFrom(x)) &&
                    !x.IsInterface &&
                    !x.IsAbstract);
            return new VerifySlots(new SignalsProvider(types));
        }

        static Node Verify(string hyperlambda)
        {
            var node = new Node("", hyperlambda);
            Verifier.Value.Signal(null, node);
            return node;
        }

        static void AssertValid(string hyperlambda)
        {
            var result = Verify(hyperlambda);
            Assert.True(result.Get<bool>(), string.Join(", ", result.Children.Select(x => x.Get<string>())));
            Assert.Empty(result.Children);
        }

        static void AssertInvalidInvocation(Node result, string slot, string detail)
        {
            Assert.False(result.Get<bool>());
            Assert.Contains(result.Children, x =>
                x.Name == "invalid-invocation" &&
                x.Get<string>().Contains($"[{slot}]", StringComparison.Ordinal) &&
                x.Get<string>().Contains(detail, StringComparison.Ordinal));
        }

        #endregion
    }
}
