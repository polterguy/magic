/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.lambda.auth.services;

namespace magic.lambda.auth.tests
{
    public class AuthExtraTests
    {
        static readonly string[] RoleList = ["admin", "dev"];

        #region [ -- HttpTicketProvider -- ]

        static HttpTicketProvider Provider(ClaimsPrincipal user)
        {
            var accessor = new Mock<IHttpContextAccessor>();
            accessor.SetupGet(x => x.HttpContext).Returns(new DefaultHttpContext { User = user });
            return new HttpTicketProvider(accessor.Object);
        }

        static ClaimsPrincipal User() => new ClaimsPrincipal(new ClaimsIdentity(
            [
                new Claim(ClaimTypes.Name, "john"),
                new Claim(ClaimTypes.Role, "admin"),
                new Claim(ClaimTypes.Role, "dev"),
                new Claim("email", "john@example.com"),
                new Claim("exp", "123"),
                new Claim("nbf", "123"),
                new Claim("iat", "123"),
            ],
            "test"));

        [Fact]
        public void ProviderReadsTheUserOfTheHttpContext()
        {
            var provider = Provider(User());
            Assert.Equal("john", provider.Username);
            Assert.Equal(RoleList, provider.Roles.ToArray());
            Assert.True(provider.IsAuthenticated());
            Assert.True(provider.IsHttp);
        }

        [Fact]
        public void ProviderClaimsExcludeRolesNameAndTimestamps()
        {
            var claims = Provider(User()).Claims.ToArray();
            Assert.Single(claims);
            Assert.Equal(("email", "john@example.com"), claims[0]);
        }

        [Fact]
        public void ProviderChecksRoles()
        {
            var provider = Provider(User());
            Assert.True(provider.InRole("admin"));
            Assert.True(provider.InRole(" dev "));
            Assert.False(provider.InRole("root"));
            Assert.Throws<ArgumentNullException>(() => provider.InRole(null));
        }

        [Fact]
        public void ProviderWithoutAnUserIsNotAuthenticated()
        {
            var provider = Provider(new ClaimsPrincipal(new ClaimsIdentity()));
            Assert.False(provider.IsAuthenticated());
            Assert.Empty(provider.Roles);
            Assert.Empty(provider.Claims);
            Assert.False(provider.InRole("admin"));
            Assert.Null(provider.Username);
        }

        [Fact]
        public void ProviderWithoutHttpContextIsNotHttp()
        {
            var accessor = new Mock<IHttpContextAccessor>();
            accessor.SetupGet(x => x.HttpContext).Returns((HttpContext)null);
            var provider = new HttpTicketProvider(accessor.Object);
            Assert.False(provider.IsHttp);
            Assert.False(provider.IsAuthenticated());
            Assert.Null(provider.Username);
            Assert.Empty(provider.Roles);
            Assert.False(new HttpTicketProvider(null).IsHttp);
        }

        #endregion

        #region [ -- Tickets -- ]

        static Node Ticket(string username = "foo", params string[] roles)
        {
            var node = new Node("", username);
            var rolesNode = new Node("roles");
            rolesNode.AddRange(roles.Select(x => new Node(".", x)));
            node.Add(rolesNode);
            var claims = new Node("claims");
            claims.Add(new Node("email", "foo@example.com"));
            node.Add(claims);
            return node;
        }

        static string Jwt(string token) => token;

        static Node Run(string slot, Node args, Node ticket = null)
        {
            var signaler = Common.Initialize();
            if (ticket == null)
                signaler.Signal(slot, args);
            else
                signaler.Scope(".auth.ticket.get", ticket, () => signaler.Signal(slot, args));
            return args;
        }

        [Fact]
        public void CreateTicketWithExpiryAndWithoutExpiry()
        {
            var specific = Run("auth.ticket.create", new Node("", null, [new Node("username", "foo"), new Node("expires", DateTime.UtcNow.AddHours(1))]));
            var never = Run("auth.ticket.create", new Node("", null, [new Node("username", "foo"), new Node("expires", DateTime.MinValue)]));
            Assert.Equal(3, Jwt(specific.Get<string>()).Split('.').Length);
            Assert.Equal(3, Jwt(never.Get<string>()).Split('.').Length);
        }

        [Fact]
        public void CreateTicketWithoutUsernameThrows()
        {
            Assert.Throws<HyperlambdaException>(() => Run("auth.ticket.create", new Node()));
        }

        [Fact]
        public void RefreshTicketWithoutArgumentsCreatesNewToken()
        {
            var node = Run("auth.ticket.refresh", new Node(), Ticket("foo", "admin"));
            Assert.Equal(3, node.Get<string>().Split('.').Length);
        }

        [Fact]
        public void RefreshTicketWithDurationAndExpires()
        {
            var withDuration = Run("auth.ticket.refresh", new Node("", null, [new Node("duration", 30L)]), Ticket());
            var withExpires = Run("auth.ticket.refresh", new Node("", null, [new Node("expires", DateTime.UtcNow.AddDays(1))]), Ticket());
            Assert.Equal(3, withDuration.Get<string>().Split('.').Length);
            Assert.Equal(3, withExpires.Get<string>().Split('.').Length);
        }

        [Fact]
        public void RefreshWithoutTicketIsDenied()
        {
            var ex = Assert.Throws<HyperlambdaException>(() => Run("auth.ticket.refresh", new Node()));
            Assert.Equal(401, ex.Status);
        }

        [Fact]
        public void VerifyTicketAllowsRootRegardlessOfRoles()
        {
            Run("auth.ticket.verify", new Node("", "admin"), Ticket("boss", "root"));
        }

        [Fact]
        public void VerifyTicketAllowsMatchingRole()
        {
            Run("auth.ticket.verify", new Node("", "other,admin"), Ticket("foo", "admin"));
        }

        [Fact]
        public void VerifyTicketDeniesMissingRoleWith403()
        {
            var ex = Assert.Throws<HyperlambdaException>(() => Run("auth.ticket.verify", new Node("", "admin"), Ticket("foo", "dev")));
            Assert.Equal(403, ex.Status);
        }

        [Fact]
        public void InRoleWithoutRolesIsTrueForAnyContextTicket()
        {
            var node = Run("auth.ticket.in-role", new Node(), Ticket("foo", "admin"));
            Assert.Equal(true, node.Value);
        }

        [Fact]
        public void InRoleChecksContextRoles()
        {
            Assert.Equal(true, Run("auth.ticket.in-role", new Node("", "dev,admin"), Ticket("foo", "admin")).Value);
            Assert.Equal(false, Run("auth.ticket.in-role", new Node("", "dev"), Ticket("foo", "admin")).Value);
        }

        [Fact]
        public void InRoleWithoutTicketOnNonHttpProviderIsFalse()
        {
            Assert.Equal(false, Run("auth.ticket.in-role", new Node("", "admin")).Value);
        }

        #endregion

        #region [ -- auth.token.verify, before any network call -- ]

        static async Task<HyperlambdaException> VerifyToken(params Node[] args)
        {
            var node = new Node("auth.token.verify", null, args);
            return await Assert.ThrowsAsync<HyperlambdaException>(() => Common.Initialize().SignalAsync("auth.token.verify", node));
        }

        [Fact]
        public async Task VerifyTokenRequiresToken()
        {
            var ex = await VerifyToken(new Node("issuer", "https://issuer.example"));
            Assert.Contains("[token]", ex.Message);
        }

        [Fact]
        public async Task VerifyTokenRequiresTrustedIssuers()
        {
            var ex = await VerifyToken(new Node("token", Run("auth.ticket.create", new Node("", null, [new Node("username", "foo")])).Get<string>()));
            Assert.Contains("trusted [issuer]", ex.Message);
        }

        [Fact]
        public async Task VerifyTokenRejectsUntrustedIssuer()
        {
            var token = Run("auth.ticket.create", new Node("", null, [new Node("username", "foo")])).Get<string>();
            var ex = await VerifyToken(new Node("token", token), new Node("issuer", "https://trusted.example"));
            Assert.Equal(401, ex.Status);
            Assert.Contains("not among the trusted issuers", ex.Message);
        }

        #endregion
    }
}
