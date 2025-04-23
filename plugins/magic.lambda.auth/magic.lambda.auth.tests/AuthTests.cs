/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.IdentityModel.Tokens.Jwt;
using Xunit;
using magic.node;
using magic.node.extensions;

namespace magic.lambda.auth.tests
{
    public class AuthTests
    {
        [Fact]
        public void AuthenticateNoRoles()
        {
            var signaler = Common.Initialize();
            var args = new Node();
            args.Add(new Node("username", "foo"));
            signaler.Signal("auth.ticket.create", args);
            Assert.NotNull(args.Value);
            Assert.True(args.Get<string>().Length > 20);
        }

        [Fact]
        public void AuthenticateNoRoles_Throws()
        {
            var signaler = Common.Initialize();
            var args = new Node();
            Assert.Throws<HyperlambdaException>(() => signaler.Signal("auth.ticket.create", args));
        }

        [Fact]
        public void NotInRoleNoConfig()
        {
            var signaler = Common.Initialize(true, false);
            var node = new Node("", "bar3");
            signaler.Signal("auth.ticket.in-role", node); // Notice, our TicketProvder in Common.cs will sort this out for us.
            Assert.False(node.Get<bool>());
        }

        [Fact]
        public void VerifyTicket_Throws()
        {
            var signaler = Common.Initialize(false);
            Assert.Throws<HyperlambdaException>(() => signaler.Signal("auth.ticket.verify", new Node()));
        }

        [Fact]
        public void VerifyRole_Throws()
        {
            var signaler = Common.Initialize();
            Assert.Throws<HyperlambdaException>(() => signaler.Signal("auth.ticket.verify", new Node("", "bar2-XXX")));
        }
    }
}
