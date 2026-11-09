/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Linq;
using Xunit;
using magic.node.extensions;
using magic.lambda.io.tests.helpers;

namespace magic.lambda.io.tests
{
    public class WhitelistRefusalTests
    {
        /*
         * A slot that changes the file system cannot be granted to a [whitelist], neither with a pinned path nor without
         * one. Code that needs to save a file for a sandboxed caller does so from a file the vocabulary executes by name.
         */
        [Theory]
        [InlineData("io.file.copy")]
        [InlineData("io.file.delete")]
        [InlineData("io.file.move")]
        [InlineData("io.file.patch")]
        [InlineData("io.file.save")]
        [InlineData("io.file.save.binary")]
        [InlineData("io.file.unzip")]
        [InlineData("io.folder.copy")]
        [InlineData("io.folder.create")]
        [InlineData("io.folder.delete")]
        [InlineData("io.folder.move")]
        [InlineData("io.stream.save-file")]
        public void SlotChangingTheFileSystemCannotBeWhitelisted(string slot)
        {
            var unpinned = Assert.Throws<HyperlambdaException>(() => Common.Evaluate($@"
whitelist
   vocabulary
      {slot}
   .lambda
      return:foo"));
            Assert.Equal($"[{slot}] can never be used inside a [whitelist]", unpinned.Message);

            var pinned = Assert.Throws<HyperlambdaException>(() => Common.Evaluate($@"
whitelist
   vocabulary
      {slot}:/etc/*
   .lambda
      return:foo"));
            Assert.Equal($"[{slot}] can never be used inside a [whitelist]", pinned.Message);
        }

        [Theory]
        [InlineData("io.file.exists")]
        [InlineData("io.file.list")]
        [InlineData("io.file.load")]
        [InlineData("io.folder.exists")]
        [InlineData("io.folder.list")]
        public void SlotThatOnlyReadsCanStillBeWhitelisted(string slot)
        {
            var lambda = Common.Evaluate($@"
whitelist
   vocabulary
      {slot}:/etc/*
      return
   .lambda
      return:foo");

            Assert.Equal("foo", lambda.Children.First().Value);
        }
    }
}
