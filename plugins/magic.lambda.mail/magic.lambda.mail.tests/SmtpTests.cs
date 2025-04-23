/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using Xunit;
using MimeKit;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.mail.tests
{
    public class SmtpTests
    {
        [Fact]
        public async Task ConnectWithServer()
        {
            var connectInvoked = false;
            var lambda = await Common.EvaluateAsync(@"
mail.smtp.send
   server
      host:foo.com
      port:123
      secure:true
      username:xxx
      password:yyy
   message
      to
         John Doe:john@doe.com
      from
         Jane Doe:jane@doe.com
      subject:Subject line
      entity:text/plain
         content:Body content",
                new helpers.MockSmtpClient(
                    (msg) => { },
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
mail.smtp.send
   server
      port:123
      secure:true
      username:xxx
      password:yyy
   message
      to
         John Doe:john@doe.com
      from
         Jane Doe:jane@doe.com
      subject:Subject line
      entity:text/plain
         content:Body content",
                new helpers.MockSmtpClient(
                    (msg) => { },
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
mail.smtp.send
   server
      username:xxx
      password:yyy
   message
      to
         John Doe:john@doe.com
      from
         Jane Doe:jane@doe.com
      subject:Subject line
      entity:text/plain
         content:Body content",
                new helpers.MockSmtpClient(
                    (msg) => { },
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
mail.smtp.send
   server
   message
      to
         John Doe:john@doe.com
      from
         Jane Doe:jane@doe.com
      subject:Subject line
      entity:text/plain
         content:Body content",
                new helpers.MockSmtpClient(
                    (msg) => { },
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
mail.smtp.send
   message
      to
         John Doe:john@doe.com
      from
         Jane Doe:jane@doe.com
      subject:Subject line
      entity:text/plain
         content:Body content",
                new helpers.MockSmtpClient(
                    (msg) => { },
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

        [Fact]
        public void SendSync()
        {
            var sendInvoked = false;
            var lambda = Common.Evaluate(@"
mail.smtp.send
   message
      to
         John Doe:john@doe.com
      from
         Jane Doe:jane@doe.com
      subject:Subject line
      entity:text/plain
         content:Body content",
                new helpers.MockSmtpClient(
                    (msg) =>
                    {
                        Assert.NotNull(msg);
                        Assert.NotEqual(typeof(Multipart), msg.Body.GetType());
                        Assert.Equal("text", msg.Body.ContentType.MediaType);
                        Assert.Equal("plain", msg.Body.ContentType.MediaSubtype);
                        Assert.Equal("Subject line", msg.Subject);
                        Assert.Single(msg.To);
                        Assert.Equal("John Doe", msg.To.First().Name);
                        Assert.Equal("john@doe.com", (msg.To.First() as MailboxAddress).Address);
                        Assert.Single(msg.From);
                        Assert.Equal("Jane Doe", msg.From.First().Name);
                        Assert.Equal("jane@doe.com", (msg.From.First() as MailboxAddress).Address);
                        Assert.Empty(msg.Cc);
                        Assert.Empty(msg.Bcc);
                        Assert.Equal(@"Content-Type: text/plain

Body content", msg.Body.ToString());
                        sendInvoked = true;
                    },
                    null,
                    null));
            Assert.True(sendInvoked);
        }

        [Fact]
        public void SendTwoMessages()
        {
            var no = 0;
            var sendInvoked = false;
            var lambda = Common.Evaluate(@"
mail.smtp.send
   message
      to
         John Doe1:john1@doe.com
      from
         Jane Doe1:jane1@doe.com
      subject:Subject line 1
      entity:text/plain
         content:Body content 1
   message
      to
         John Doe2:john2@doe.com
      from
         Jane Doe2:jane2@doe.com
      subject:Subject line 2
      entity:text/plain
         content:Body content 2",
                new helpers.MockSmtpClient(
                    (msg) =>
                    {
                        Assert.NotNull(msg);
                        Assert.NotEqual(typeof(Multipart), msg.Body.GetType());
                        Assert.Equal("text", msg.Body.ContentType.MediaType);
                        Assert.Equal("plain", msg.Body.ContentType.MediaSubtype);
                        Assert.Single(msg.To);
                        Assert.Single(msg.From);
                        Assert.Empty(msg.Cc);
                        Assert.Empty(msg.Bcc);
                        if (no == 0)
                        {
                            Assert.Equal("Subject line 1", msg.Subject);
                            Assert.Equal("John Doe1", msg.To.First().Name);
                            Assert.Equal("john1@doe.com", (msg.To.First() as MailboxAddress).Address);
                            Assert.Equal("Jane Doe1", msg.From.First().Name);
                            Assert.Equal(@"Content-Type: text/plain

Body content 1", msg.Body.ToString());
                        }
                        else
                        {
                            Assert.Equal("Subject line 2", msg.Subject);
                            Assert.Equal("John Doe2", msg.To.First().Name);
                            Assert.Equal("john2@doe.com", (msg.To.First() as MailboxAddress).Address);
                            Assert.Equal("Jane Doe2", msg.From.First().Name);
                            Assert.Equal(@"Content-Type: text/plain

Body content 2", msg.Body.ToString());
                        }
                        no += 1;
                        sendInvoked = true;
                    },
                    null,
                    null));
            Assert.True(sendInvoked);
            Assert.Equal(2, no);
        }

        [Fact]
        public async Task SendConfigFrom()
        {
            var authenticateInvoked = false;
            var connectInvoked = false;
            var sendInvoked = false;
            var lambda = await Common.EvaluateAsync(@"
mail.smtp.send
   message
      to
         John Doe:john@doe.com
      subject:Subject line
      entity:text/plain
         content:Body content",
                new helpers.MockSmtpClient(
                    (msg) =>
                    {
                        Assert.Equal("Foo Bar", (msg.From.First() as MailboxAddress).Name);
                        Assert.Equal("foo@bar.com", (msg.From.First() as MailboxAddress).Address);
                        sendInvoked = true;
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
            Assert.True(sendInvoked);
        }

        [Fact]
        public async Task SendAsync()
        {
            var sendInvoked = false;
            var lambda = await Common.EvaluateAsync(@"
mail.smtp.send
   message
      to
         John Doe:john@doe.com
      from
         Jane Doe:jane@doe.com
      subject:Subject line
      entity:text/plain
         content:Body content",
                new helpers.MockSmtpClient(
                    (msg) =>
                    {
                        Assert.NotNull(msg);
                        Assert.NotEqual(typeof(Multipart), msg.Body.GetType());
                        Assert.Equal("text", msg.Body.ContentType.MediaType);
                        Assert.Equal("plain", msg.Body.ContentType.MediaSubtype);
                        Assert.Equal("Subject line", msg.Subject);
                        Assert.Single(msg.To);
                        Assert.Equal("John Doe", msg.To.First().Name);
                        Assert.Equal("john@doe.com", (msg.To.First() as MailboxAddress).Address);
                        Assert.Single(msg.From);
                        Assert.Equal("Jane Doe", msg.From.First().Name);
                        Assert.Equal("jane@doe.com", (msg.From.First() as MailboxAddress).Address);
                        Assert.Empty(msg.Cc);
                        Assert.Empty(msg.Bcc);
                        Assert.Equal(@"Content-Type: text/plain

Body content", msg.Body.ToString());
                        sendInvoked = true;
                    },
                    null,
                    null));
            Assert.True(sendInvoked);
        }

        [Fact]
        public async Task SendWithAttachment()
        {
            var sendInvoked = false;
            var lambda = await Common.EvaluateAsync(@"
mail.smtp.send
   message
      to
         John Doe:john@doe.com
      from
         Jane Doe:jane@doe.com
      subject:Subject line
      entity:text/plain
         filename:foo.txt",
                new helpers.MockSmtpClient(
                    (msg) =>
                    {
                        Assert.NotNull(msg);
                        Assert.NotEqual(typeof(Multipart), msg.Body.GetType());
                        Assert.Equal("text", msg.Body.ContentType.MediaType);
                        Assert.Equal("plain", msg.Body.ContentType.MediaSubtype);
                        Assert.Equal("Subject line", msg.Subject);
                        Assert.Single(msg.To);
                        Assert.Equal("John Doe", msg.To.First().Name);
                        Assert.Equal("john@doe.com", (msg.To.First() as MailboxAddress).Address);
                        Assert.Single(msg.From);
                        Assert.Equal("Jane Doe", msg.From.First().Name);
                        Assert.Equal("jane@doe.com", (msg.From.First() as MailboxAddress).Address);
                        Assert.Empty(msg.Cc);
                        Assert.Empty(msg.Bcc);
                        Assert.Equal(@"Content-Type: text/plain
Content-Disposition: attachment; filename=foo.txt

This is content", msg.Body.ToString());
                        sendInvoked = true;
                    },
                    null,
                    null));
            Assert.True(sendInvoked);
        }

        [Fact]
        public async Task SendWithCcAndBcc()
        {
            var sendInvoked = false;
            var lambda = await Common.EvaluateAsync(@"
mail.smtp.send
   message
      to
         John Doe:john@doe.com
      from
         Jane Doe:jane@doe.com
      cc
         Peter Doe:peter@doe.com
      bcc
         Peter Doe 1:peter1@doe.com
         Peter Doe 2:peter2@doe.com
      subject:Subject line
      entity:text/plain
         content:Body content",
                new helpers.MockSmtpClient(
                    (msg) =>
                    {
                        Assert.NotNull(msg);
                        Assert.NotEqual(typeof(Multipart), msg.Body.GetType());
                        Assert.Equal("text", msg.Body.ContentType.MediaType);
                        Assert.Equal("plain", msg.Body.ContentType.MediaSubtype);
                        Assert.Equal("Subject line", msg.Subject);
                        Assert.Single(msg.To);
                        Assert.Equal("John Doe", msg.To.First().Name);
                        Assert.Equal("john@doe.com", (msg.To.First() as MailboxAddress).Address);
                        Assert.Single(msg.From);
                        Assert.Equal("Jane Doe", msg.From.First().Name);
                        Assert.Equal("jane@doe.com", (msg.From.First() as MailboxAddress).Address);
                        Assert.Single(msg.Cc);
                        Assert.Equal("Peter Doe", msg.Cc.First().Name);
                        Assert.Equal("peter@doe.com", (msg.Cc.First() as MailboxAddress).Address);
                        Assert.Equal(2, msg.Bcc.Count);
                        Assert.Equal("Peter Doe 1", msg.Bcc.First().Name);
                        Assert.Equal("peter1@doe.com", (msg.Bcc.First() as MailboxAddress).Address);
                        Assert.Equal("Peter Doe 2", msg.Bcc.Skip(1).First().Name);
                        Assert.Equal("peter2@doe.com", (msg.Bcc.Skip(1).First() as MailboxAddress).Address);
                        sendInvoked = true;
                    },
                    null,
                    null));
            Assert.True(sendInvoked);
        }

        [Fact]
        public async Task SendWithoutTo_Throws()
        {
            await Assert.ThrowsAsync<HyperlambdaException>(async () =>
            {
                await Common.EvaluateAsync(@"
mail.smtp.send
   message
      from
         Jane Doe:jane@doe.com
      subject:Subject line
      entity:text/plain
         content:Body content",
                    new helpers.MockSmtpClient(
                        (msg) => { },
                        null,
                        null));
            });
        }

        [Slot(Name = ".io.folder.root")]
        class GetRootFolderSlot : ISlot
        {
            public void Signal(ISignaler signaler, Node input)
            {
                input.Value = Assembly.GetExecutingAssembly().Location.Replace("\\", "/").Replace("/magic.lambda.mail.tests.dll", "/");
            }
        }
    }
}
