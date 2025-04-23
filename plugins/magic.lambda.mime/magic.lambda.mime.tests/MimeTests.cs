/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Text;
using Xunit;
using MimeKit;
using magic.node;
using magic.node.extensions;

namespace magic.lambda.mime.tests
{
    public class MimeTests
    {
        [Fact]
        public void ParseMessage()
        {
            var entity = new TextPart("plain")
            {
                Text = "Hello World!"
            };
            var lambda = new Node("", entity.ToString());
            var signaler = Common.GetSignaler();
            signaler.Signal("mime.parse", lambda);
            Assert.Equal("text/plain", lambda.GetEx<string>());
            Assert.Equal("content", lambda.Children.First().Name);
            Assert.Equal("Hello World!", lambda.Children.First().GetEx<string>());
        }

        [Fact]
        public void ParseRawMessage()
        {
            var entity = new TextPart("plain")
            {
                Text = "Hello World!"
            };
            var lambda = new Node("", entity);
            var signaler = Common.GetSignaler();
            signaler.Signal(".mime.parse", lambda);
            Assert.Equal("text/plain", lambda.GetEx<string>());
            Assert.Equal("content", lambda.Children.First().Name);
            Assert.Equal("Hello World!", lambda.Children.First().GetEx<string>());
        }

        [Fact]
        public void CreateSimpleMessage()
        {
            var signaler = Common.GetSignaler();
            var node = new Node("", "text/plain");
            var content = new Node("content", "foo bar");
            node.Add(content);
            signaler.Signal("mime.create", node);
            Assert.Equal(@"Content-Type: text/plain

foo bar", node.Get<string>());
        }

        [Fact]
        public void CreateSimpleStructuredMessage()
        {
            var signaler = Common.GetSignaler();
            var node = new Node("", "text/plain");
            node.Add(new Node("content", "foo bar"));
            node.Add(new Node("structured", true));
            signaler.Signal("mime.create", node);
            Assert.Equal(@"text/plain", node.Children.First().Get<string>());
            Assert.Equal(@"foo bar", node.Children.Skip(1).First().Get<string>());
            Assert.Equal(@"Content-Type", node.Children.First().Name);
            Assert.Equal(@"content", node.Children.Skip(1).First().Name);
        }

        [Fact]
        public void CreateMultipart()
        {
            var signaler = Common.GetSignaler();
            var node = new Node("", "multipart/mixed");
            var entity1 = new Node("entity", "application/octet-stream");
            entity1.Add(new Node("content", "foo bar 1"));
            node.Add(entity1);
            var entity2 = new Node("entity", "text/plain");
            entity2.Add(new Node("content", "foo bar 2"));
            node.Add(entity2);
            var entity3 = new Node("entity", "text/plain");
            var headers3 = new Node("headers");
            headers3.Add(new Node("X-Foo", "bar"));
            entity3.Add(headers3);
            entity3.Add(new Node("filename", "/test.txt"));
            node.Add(entity3);
            signaler.Signal("mime.create", node);

            // Reversing process.
            var result = new Node("", node.Get<string>());
            signaler.Signal("mime.parse", result);

            Assert.Equal("", result.Name);
            Assert.Equal("multipart/mixed", result.Value);
            Assert.Equal("entity", result.Children.First().Name);
            Assert.Equal("application/octet-stream", result.Children.First().Value);
            Assert.Equal("entity", result.Children.Skip(1).First().Name);
            Assert.Equal("text/plain", result.Children.Skip(1).First().Value);
            Assert.Equal("entity", result.Children.Skip(2).First().Name);
            Assert.Equal("text/plain", result.Children.Skip(2).First().Value);
            Assert.Equal("content", result.Children.First().Children.First().Name);
            Assert.Equal("foo bar 1", Encoding.UTF8.GetString(result.Children.First().Children.First().Get<byte[]>()));
            Assert.Equal("content", result.Children.Skip(1).First().Children.First().Name);
            Assert.Equal("foo bar 2", result.Children.Skip(1).First().Children.First().Value);
            Assert.Equal("headers", result.Children.Skip(2).First().Children.First().Name);
            Assert.Equal("X-Foo", result.Children.Skip(2).First().Children.First().Children.First().Name);
            Assert.Equal("bar", result.Children.Skip(2).First().Children.First().Children.First().Value);
            Assert.Equal("Content-Disposition", result.Children.Skip(2).First().Children.First().Children.Skip(1).First().Name);
            Assert.Equal("attachment; filename=test.txt", result.Children.Skip(2).First().Children.First().Children.Skip(1).First().Value);
            Assert.Equal("content", result.Children.Skip(2).First().Children.Skip(1).First().Name);
            Assert.Equal("Some example test file used as attachment", result.Children.Skip(2).First().Children.Skip(1).First().Value);
        }

        [Fact]
        public void CreateSimpleMessageRaw()
        {
            var signaler = Common.GetSignaler();
            var node = new Node("", "text/plain");
            var content = new Node("content", "foo bar");
            node.Add(content);
            signaler.Signal(".mime.create", node);
            using (var entity = node.Value as MimeEntity)
            {
                Assert.Equal(@"Content-Type: text/plain

foo bar", entity.ToString());
            }
        }

        [Fact]
        public void WithContentEncoding()
        {
            var signaler = Common.GetSignaler();
            var node = new Node("", "text/plain");
            var content = new Node("content", "foo bar");
            node.Add(content);
            content.Add(new Node("Content-Encoding", "default"));
            signaler.Signal(".mime.create", node);
            using (var entity = node.Value as MimeEntity)
            {
                Assert.Equal(@"Content-Type: text/plain

foo bar", entity.ToString());
            }
        }

        [Fact]
        public void WithHeaders()
        {
            var signaler = Common.GetSignaler();
            var node = new Node("", "text/plain");
            var content = new Node("content", "foo bar");
            var headers = new Node("headers");
            headers.Add(new Node("X-Foo", "bar"));
            node.Add(headers);
            node.Add(content);
            signaler.Signal(".mime.create", node);
            using (var entity = node.Value as MimeEntity)
            {
                Assert.Contains("X-Foo: bar", entity.ToString());
                Assert.Contains("Content-Type: text/plain", entity.ToString());
                Assert.Contains("foo bar", entity.ToString());
            }
        }

        [Fact]
        public void CreateFromFilename()
        {
            var signaler = Common.GetSignaler();
            var node = new Node("", "text/plain");
            var content = new Node("filename", "/test.txt");
            content.Add(new Node("Content-Encoding", "default"));
            node.Add(content);
            signaler.Signal(".mime.create", node);
            using (var entity = node.Value as MimeEntity)
            {
                Assert.Contains("Content-Disposition: attachment; filename=test.txt", entity.ToString());
                Assert.Contains("Content-Type: text/plain", entity.ToString());
                Assert.Contains("Some example test file used as attachment", entity.ToString());
            }
        }

        [Fact]
        public void CreateFromFilename_THROWS()
        {
            var signaler = Common.GetSignaler();
            var node = new Node("", "text/plain");
            var content = new Node("filename");
            node.Add(content);
            Assert.Throws<HyperlambdaException>(() => signaler.Signal(".mime.create", node));
        }

        [Fact]
        public void WrongContentType_THROWS_01()
        {
            var signaler = Common.GetSignaler();
            var node = new Node("", "text-plain");
            var content = new Node("content", "foo bar");
            node.Add(content);
            Assert.Throws<HyperlambdaException>(() => signaler.Signal("mime.create", node));
        }

        [Fact]
        public void WrongContentType_THROWS_02()
        {
            var signaler = Common.GetSignaler();
            var node = new Node("", "text/plain/foo");
            var content = new Node("content", "foo bar");
            node.Add(content);
            Assert.Throws<HyperlambdaException>(() => signaler.Signal("mime.create", node));
        }

        [Fact]
        public void WrongContentType_THROWS_03()
        {
            var signaler = Common.GetSignaler();
            var node = new Node("", "APPLICATION/octet-stream");
            var content = new Node("content", "foo bar");
            node.Add(content);
            Assert.Throws<HyperlambdaException>(() => signaler.Signal("mime.create", node));
        }

        [Fact]
        public void WrongContentType_THROWS_04()
        {
            var signaler = Common.GetSignaler();
            var node = new Node("", "text/plain");
            Assert.Throws<HyperlambdaException>(() => signaler.Signal("mime.create", node));
        }

        [Fact]
        public void WrongContentType_THROWS_05()
        {
            var signaler = Common.GetSignaler();
            var node = new Node("", "text/plain");
            var content = new Node("content");
            node.Add(content);
            Assert.Throws<HyperlambdaException>(() => signaler.Signal("mime.create", node));
        }

        [Fact]
        public void CreateMessageWithHeaders()
        {
            var signaler = Common.GetSignaler();
            var node = new Node("", "text/plain");
            var content = new Node("content", "foo bar");
            node.Add(content);
            var headers = new Node("headers");
            node.Add(headers);
            var header = new Node("Foo-Bar", "howdy");
            headers.Add(header);
            signaler.Signal(".mime.create", node);
            using (var entity = node.Value as MimeEntity)
            {
                Assert.Equal(@"Content-Type: text/plain
Foo-Bar: howdy

foo bar", entity.ToString());
            }
        }

        [Fact]
        public void CreateMultipartMessage()
        {
            var signaler = Common.GetSignaler();

            // Creating a Multipart
            var node = new Node("", "multipart/mixed");
            var message1 = new Node("entity", "text/plain");
            node.Add(message1);
            var content1 = new Node("content", "some text");
            message1.Add(content1);
            var message2 = new Node("entity", "text/plain");
            node.Add(message2);
            var content2 = new Node("content", "some other text");
            message2.Add(content2);
            signaler.Signal(".mime.create", node);
            using (var entity = node.Value as MimeEntity)
            {
                // Running through a couple of simple asserts.
                Assert.Equal(typeof(Multipart), entity.GetType());
                var multipart = entity as Multipart;
                Assert.Equal(2, multipart.Count);
                Assert.Equal(typeof(MimePart), multipart.First().GetType());
                Assert.Equal(typeof(MimePart), multipart.Skip(1).First().GetType());
                var text1 = multipart.First() as MimePart;
                Assert.Equal(@"Content-Type: text/plain

some text", text1.ToString());
                var text2 = multipart.Skip(1).First() as MimePart;
                Assert.Equal(@"Content-Type: text/plain

some other text", text2.ToString());
            }
        }
    }
}