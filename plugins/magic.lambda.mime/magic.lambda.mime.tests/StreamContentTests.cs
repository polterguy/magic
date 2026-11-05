/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.IO;
using System.Text;
using Xunit;
using magic.node;
using magic.node.extensions;

namespace magic.lambda.mime.tests
{
    public class StreamContentTests
    {
        [Fact]
        public void StreamContentIsAttachedAsTheFileNotTheTypeName()
        {
            var node = new Node("", "text/plain");
            node.Add(new Node("content", new MemoryStream(Encoding.UTF8.GetBytes("hello from a stream"))));
            Common.GetSignaler().Signal("mime.create", node);
            var mime = node.Get<string>();
            Assert.Contains("hello from a stream", mime);
            Assert.DoesNotContain("System.IO", mime);
        }
    }
}
