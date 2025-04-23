/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Threading.Tasks;
using Xunit;
using MimeKit;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.mail.tests
{
    public class PopTests
    {
        [Fact]
        public async Task ConnectWithServer()
        {
            var connectInvoked = false;
            var lambda = await Common.EvaluateAsync(@"
mail.pop3.fetch
   server
      host:foo.com
      port:123
      secure:true
      username:xxx
      password:yyy
   .lambda",
                null,
                new helpers.MockPop3Client(
                    (index) =>
                    {
                        return null;
                    },
                    () => 0,
                    (host, port, useSsl) =>
                    {
                        Assert.Equal("foo.com", host);
                        Assert.Equal(123, port);
                        Assert.True(useSsl);
                        connectInvoked = true;
                    }));
            Assert.True(connectInvoked);
        }

        [Fact]
        public async Task ConnectWithConfig_01()
        {
            var connectInvoked = false;
            var lambda = await Common.EvaluateAsync(@"
mail.pop3.fetch
   server
      port:123
      secure:true
      username:xxx
      password:yyy
   .lambda",
                null,
                new helpers.MockPop3Client(
                    (index) =>
                    {
                        return null;
                    },
                    () => 0,
                    (host, port, useSsl) =>
                    {
                        Assert.Equal("foo2.com", host);
                        Assert.Equal(123, port);
                        Assert.True(useSsl);
                        connectInvoked = true;
                    }));
            Assert.True(connectInvoked);
        }

        [Fact]
        public async Task ConnectWithConfig_02()
        {
            var connectInvoked = false;
            var authenticateInvoked = false;
            var lambda = await Common.EvaluateAsync(@"
mail.pop3.fetch
   server
      username:xxx
      password:yyy
   .lambda",
                null,
                new helpers.MockPop3Client(
                    (index) =>
                    {
                        return null;
                    },
                    () => 0,
                    (host, port, useSsl) =>
                    {
                        Assert.Equal("foo2.com", host);
                        Assert.Equal(321, port);
                        Assert.False(useSsl);
                        connectInvoked = true;
                    },
                    (username, password) =>
                    {
                        Assert.Equal("xxx", username);
                        Assert.Equal("yyy", password);
                        authenticateInvoked = true;
                    }));
            Assert.True(connectInvoked);
            Assert.True(authenticateInvoked);
        }

        [Fact]
        public async Task ConcectWithConfig_03()
        {
            var authenticateInvoked = false;
            var lambda = await Common.EvaluateAsync(@"
mail.pop3.fetch
   server
   .lambda",
                null,
                new helpers.MockPop3Client(
                    (index) =>
                    {
                        return null;
                    },
                    () => 0,
                    null,
                    (username, password) =>
                    {
                        Assert.Equal("xxx2", username);
                        Assert.Equal("yyy2", password);
                        authenticateInvoked = true;
                    }));
            Assert.True(authenticateInvoked);
        }

        [Fact]
        public async Task ConnectWithConfig_04()
        {
            var authenticateInvoked = false;
            var connectInvoked = false;
            var lambda = await Common.EvaluateAsync(@"
mail.pop3.fetch
   .lambda",
                null,
                new helpers.MockPop3Client(
                    (index) =>
                    {
                        return null;
                    },
                    () => 0,
                    (host, port, useSsl) =>
                    {
                        Assert.Equal("foo2.com", host);
                        Assert.Equal(321, port);
                        Assert.False(useSsl);
                        connectInvoked = true;
                    },
                    (username, password) =>
                    {
                        Assert.Equal("xxx2", username);
                        Assert.Equal("yyy2", password);
                        authenticateInvoked = true;
                    }));
            Assert.True(authenticateInvoked);
            Assert.True(connectInvoked);
        }

        [Slot(Name = "RetrieveOneMessageSlot")]
        class RetrieveOneMessageSlot : ISlot
        {
            public static int _invocationCount = 0;
            public void Signal(ISignaler signaler, Node input)
            {
                _invocationCount += 1;
                var entity = input.Children.SingleOrDefault(x => x.Name == "entity");
                Assert.NotNull(entity);
                Assert.Equal("text/plain", entity.GetEx<string>());
                Assert.Single(entity.Children);
                Assert.Equal("content", entity.Children.First().Name);
                Assert.Empty(entity.Children.First().Children);
                Assert.Equal("Body of message", entity.Children.First().GetEx<string>());
                Assert.Single(entity.Children);
                Assert.Equal("This is subject", input.Children.FirstOrDefault(x => x.Name == "subject")?.GetEx<string>());
                Assert.Single(input.Children.FirstOrDefault(x => x.Name == "from")?.Children);
                Assert.Single(input.Children.FirstOrDefault(x => x.Name == "to")?.Children);
                Assert.Equal("Foo", input.Children.FirstOrDefault(x => x.Name == "from")?.Children?.FirstOrDefault()?.Name);
                Assert.Equal("foo@bar.com", input.Children.FirstOrDefault(x => x.Name == "from")?.Children?.FirstOrDefault()?.GetEx<string>());
                Assert.Equal("John", input.Children.FirstOrDefault(x => x.Name == "to")?.Children?.FirstOrDefault()?.Name);
                Assert.Equal("john@doe.com", input.Children.FirstOrDefault(x => x.Name == "to")?.Children?.FirstOrDefault()?.GetEx<string>());
                Assert.Null(input.Children.FirstOrDefault(x => x.Name == "cc"));
                Assert.Null(input.Children.FirstOrDefault(x => x.Name == "bcc"));
            }
        }

        [Fact]
        public async Task RetrieveOneMessage()
        {
            var authenticateInvoked = false;
            var connectInvoked = false;
            var retrieveInvoked = 0;
            var lambda = await Common.EvaluateAsync(@"
mail.pop3.fetch
   .lambda
      add:x:+
         get-nodes:x:@.message/*
      RetrieveOneMessageSlot",
                null,
                new helpers.MockPop3Client(
                    (index) =>
                    {
                        Assert.Equal(0, index);
                        retrieveInvoked += 1;
                        var message = new MimeMessage();
                        message.From.Add(new MailboxAddress("Foo", "foo@bar.com"));
                        message.To.Add(new MailboxAddress("John", "john@doe.com"));
                        message.Subject = "This is subject";

                        message.Body = new TextPart("plain")
                        {
                            Text = @"Body of message"
                        };
                        return message;
                    },
                    () =>
                    {
                        return 1;
                    },
                    (host, port, useSsl) =>
                    {
                        Assert.Equal("foo2.com", host);
                        Assert.Equal(321, port);
                        Assert.False(useSsl);
                        connectInvoked = true;
                    },
                    (username, password) =>
                    {
                        Assert.Equal("xxx2", username);
                        Assert.Equal("yyy2", password);
                        authenticateInvoked = true;
                    }));
            Assert.True(authenticateInvoked);
            Assert.True(connectInvoked);
            Assert.Equal(1, retrieveInvoked);
            Assert.Equal(1, RetrieveOneMessageSlot._invocationCount);
        }

        [Slot(Name = "RetrieveOneMessageRawSlot")]
        class RetrieveOneMessageRawSlot : ISlot
        {
            public static int _invocationCount = 0;
            public void Signal(ISignaler signaler, Node input)
            {
                _invocationCount += 1;
                var message = input.Children.SingleOrDefault(x => x.Name == ".message");
                Assert.NotNull(message);
                Assert.Contains("MIME-Version: 1.0", message.GetEx<string>());
                Assert.Contains("Body of message", message.GetEx<string>());
                Assert.Contains("This is subject", message.GetEx<string>());
                Assert.Contains("foo@bar.com", message.GetEx<string>());
            }
        }

        [Fact]
        public void RetrieveOneMessageRaw()
        {
            var authenticateInvoked = false;
            var connectInvoked = false;
            var retrieveInvoked = 0;
            var lambda = Common.Evaluate(@"
mail.pop3.fetch
   raw:true
   .lambda
      add:x:+
         get-nodes:x:@.message
      RetrieveOneMessageRawSlot",
                null,
                new helpers.MockPop3Client(
                    (index) =>
                    {
                        Assert.Equal(0, index);
                        retrieveInvoked += 1;
                        var message = new MimeMessage();
                        message.From.Add(new MailboxAddress("Foo", "foo@bar.com"));
                        message.To.Add(new MailboxAddress("John", "john@doe.com"));
                        message.Subject = "This is subject";

                        message.Body = new TextPart("plain")
                        {
                            Text = @"Body of message"
                        };
                        return message;
                    },
                    () =>
                    {
                        return 1;
                    },
                    (host, port, useSsl) =>
                    {
                        Assert.Equal("foo2.com", host);
                        Assert.Equal(321, port);
                        Assert.False(useSsl);
                        connectInvoked = true;
                    },
                    (username, password) =>
                    {
                        Assert.Equal("xxx2", username);
                        Assert.Equal("yyy2", password);
                        authenticateInvoked = true;
                    }));
            Assert.True(authenticateInvoked);
            Assert.True(connectInvoked);
            Assert.Equal(1, retrieveInvoked);
            Assert.Equal(1, RetrieveOneMessageSlot._invocationCount);
        }
    }
}
