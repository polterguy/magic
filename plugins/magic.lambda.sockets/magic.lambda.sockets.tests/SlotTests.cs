/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Moq;
using Xunit;
using magic.node;
using magic.node.extensions;
using magic.node.extensions.hyperlambda;
using magic.signals.contracts;

namespace magic.lambda.sockets.tests
{
    public class SlotTests
    {
        static readonly string[] RoleGroups = ["role:admin", "role:root"];
        static readonly string[] JohnAndJane = ["john", "jane"];
        static readonly string[] Team1Group = ["group:team1"];
        static readonly string[] TwoClients = ["c1", "c2"];
        static readonly string[] AConnections = ["conn-a1", "conn-a2"];
        static readonly string[] SecondConnection = ["c2"];

        static async Task<(FakeHub Hub, Node Lambda)> Run(string hl, bool enabled = true)
        {
            var hub = new FakeHub();
            var lambda = HyperlambdaParser.Parse(hl);
            await Common.GetSignaler(hub, enabled).SignalAsync("eval", lambda);
            return (hub, lambda);
        }

        /*
         * Connects a user to the hub, which registers the connection in the shared static dictionary.
         */
        static async Task<string> Connect(string username, string connection, params string[] roles)
        {
            StubTicket.Username = username;
            StubTicket.Roles = roles;
            var hub = new FakeHub();
            var magicHub = NewHub(hub, connection, username);
            await magicHub.OnConnectedAsync();
            return username;
        }

        /*
         * Returns the connections of the specified user, as listed by [sockets.users].
         */
        static async Task<string[]> Connections(string username)
        {
            var (_, users) = await Run("sockets.users\n   filter:" + username);
            var user = users.Children.First().Children.FirstOrDefault(x => x.Children.First().Get<string>() == username);
            return user?.Children.Skip(1).First().Children.Select(x => x.Get<string>()).ToArray() ?? Array.Empty<string>();
        }

        internal static MagicHub NewHub(FakeHub fake, string connection, string username, Mock<magic.lambda.logging.contracts.ILogger> logger = null, Mock<magic.node.contracts.IFileService> files = null)
        {
            var ctx = new Mock<HubCallerContext>();
            ctx.SetupGet(x => x.ConnectionId).Returns(connection);
            ctx.SetupGet(x => x.ConnectionAborted).Returns(CancellationToken.None);
            ctx.SetupGet(x => x.User).Returns(username == null ? null : new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(ClaimTypes.Name, username) }, "test")));

            var executions = new Mock<IExecutionRegistry>();
            executions
                .Setup(x => x.Create(It.IsAny<CancellationToken>()))
                .Returns(() => new magic.signals.contracts.ExecutionContext("exec-1", new CancellationTokenSource()));

            var resolver = new Mock<magic.node.contracts.IRootResolver>();
            resolver.Setup(x => x.AbsolutePath(It.IsAny<string>())).Returns<string>(x => "/" + x);

            return new MagicHub(
                Common.GetSignaler(fake),
                new Mock<magic.endpoint.contracts.IHttpArgumentsHandler>().Object,
                (logger ?? new Mock<magic.lambda.logging.contracts.ILogger>()).Object,
                (files ?? new Mock<magic.node.contracts.IFileService>()).Object,
                resolver.Object,
                executions.Object)
            {
                Context = ctx.Object,
                Groups = fake.GroupManager.Object,
            };
        }

        [Fact]
        public async Task SignalToEveryone()
        {
            var (hub, _) = await Run("sockets.signal:foo.bar\n   args\n      a:b");
            var sent = Assert.Single(hub.Sent);
            Assert.Equal("all", sent.Target);
            Assert.Equal("foo.bar", sent.Method);
            Assert.Contains("\"a\"", sent.Argument as string);
            Assert.Contains("\"b\"", sent.Argument as string);
        }

        [Fact]
        public async Task SignalWithNestedArgs()
        {
            var (hub, _) = await Run("sockets.signal:foo.bar\n   args\n      outer\n         inner:deep");
            var json = Assert.Single(hub.Sent).Argument as string;
            Assert.Contains("\"outer\"", json);
            Assert.Contains("\"inner\"", json);
            Assert.Contains("\"deep\"", json);
        }

        [Fact]
        public async Task AddingUnconnectedUserToGroupDoesNothing()
        {
            var (hub, _) = await Run("sockets.user.add-to-group:nobody" + Guid.NewGuid().ToString("N") + "\n   group:team");
            Assert.Empty(hub.Groups);
        }

        [Fact]
        public async Task SignalWithoutArgs()
        {
            var (hub, lambda) = await Run("sockets.signal:foo.bar");
            var sent = Assert.Single(hub.Sent);
            Assert.Null(sent.Argument);
            Assert.Empty(lambda.Children.First().Children);
        }

        [Fact]
        public async Task SignalToRoles()
        {
            var (hub, _) = await Run("sockets.signal:foo.bar\n   roles:admin, root");
            var sent = Assert.Single(hub.Sent);
            Assert.Equal("groups", sent.Target);
            Assert.Equal(RoleGroups, sent.Names);
        }

        [Fact]
        public async Task SignalToUsers()
        {
            var (hub, _) = await Run("sockets.signal:foo.bar\n   users:john, jane");
            var sent = Assert.Single(hub.Sent);
            Assert.Equal("users", sent.Target);
            Assert.Equal(JohnAndJane, sent.Names);
        }

        [Fact]
        public async Task SignalToGroups()
        {
            var (hub, _) = await Run("sockets.signal:foo.bar\n   groups:team1");
            var sent = Assert.Single(hub.Sent);
            Assert.Equal("groups", sent.Target);
            Assert.Equal(Team1Group, sent.Names);
        }

        [Fact]
        public async Task SignalToClients()
        {
            var (hub, _) = await Run("sockets.signal:foo.bar\n   clients:c1, c2");
            var sent = Assert.Single(hub.Sent);
            Assert.Equal("clients", sent.Target);
            Assert.Equal(TwoClients, sent.Names);
        }

        [Fact]
        public async Task SignalToMoreThanOneTargetThrows()
        {
            await Assert.ThrowsAsync<HyperlambdaException>(
                () => Run("sockets.signal:foo.bar\n   roles:admin\n   users:john"));
        }

        [Theory]
        [InlineData("sockets.signal:foo.bar")]
        [InlineData("sockets.users")]
        [InlineData("sockets.users.count")]
        [InlineData("sockets.user.add-to-group:john\n   group:g")]
        [InlineData("sockets.user.remove-from-group:john\n   group:g")]
        [InlineData("sockets.connection.enter-group\n   group:g")]
        [InlineData("sockets.connection.leave-group\n   group:g")]
        public async Task DisabledSocketsThrow(string hl)
        {
            var ex = await Assert.ThrowsAsync<HyperlambdaException>(() => Run(hl, enabled: false));
            Assert.Contains("not enabled", ex.Message);
        }

        [Fact]
        public async Task ConnectedUsersAreListedAndCounted()
        {
            var prefix = "u" + Guid.NewGuid().ToString("N");
            await Connect(prefix + "a", "conn-a1");
            await Connect(prefix + "a", "conn-a2");
            await Connect(prefix + "b", "conn-b1");

            var (_, count) = await Run("sockets.users.count\n   filter:" + prefix);
            Assert.Equal(2, count.Children.First().Value);

            var (_, users) = await Run("sockets.users\n   filter:" + prefix);
            var list = users.Children.First().Children.ToList();
            Assert.Equal(2, list.Count);
            var a = list.Single(x => x.Children.First().Get<string>() == prefix + "a");
            Assert.Equal(AConnections, a.Children.Skip(1).First().Children.Select(x => x.Get<string>()).ToArray());

            var (_, limited) = await Run("sockets.users\n   filter:" + prefix + "\n   limit:1");
            Assert.Single(limited.Children.First().Children);
            var (_, offset) = await Run("sockets.users\n   filter:" + prefix + "\n   offset:1\n   limit:5");
            Assert.Single(offset.Children.First().Children);
        }

        [Fact]
        public async Task DisconnectRemovesConnectionsAndThenUser()
        {
            var name = "d" + Guid.NewGuid().ToString("N");
            await Connect(name, "c1");
            await Connect(name, "c2");
            Assert.Equal(2, (await Connections(name)).Length);

            var fake = new FakeHub();
            await NewHub(fake, "c1", name).OnDisconnectedAsync(null);
            Assert.Equal(SecondConnection, await Connections(name));
            await NewHub(fake, "c2", name).OnDisconnectedAsync(null);
            Assert.Empty(await Connections(name));
        }

        [Fact]
        public async Task UnauthenticatedConnectionIsKeyedByConnectionId()
        {
            var connection = "anon-" + Guid.NewGuid().ToString("N");
            await Connect(null, connection);
            Assert.Equal([connection], await Connections(connection));
            await NewHub(new FakeHub(), connection, null).OnDisconnectedAsync(null);
            Assert.Empty(await Connections(connection));
        }

        [Fact]
        public async Task ConnectingAddsConnectionToRoleGroups()
        {
            StubTicket.Username = "r" + Guid.NewGuid().ToString("N");
            StubTicket.Roles = new[] { "admin", "root" };
            var fake = new FakeHub();
            await NewHub(fake, "conn-r", StubTicket.Username).OnConnectedAsync();
            Assert.Equal(RoleGroups, fake.Groups.Select(x => x.Group).ToArray());
            Assert.All(fake.Groups, x => Assert.Equal("conn-r", x.Connection));
        }

        [Fact]
        public async Task UserCanBeAddedToAndRemovedFromGroup()
        {
            var name = "g" + Guid.NewGuid().ToString("N");
            await Connect(name, "g1");
            await Connect(name, "g2");

            var (hub, _) = await Run("sockets.user.add-to-group:" + name + "\n   group:team");
            Assert.Equal(new[] { ("add", "g1", "group:team"), ("add", "g2", "group:team") }, hub.Groups.ToArray());

            var (hub2, _) = await Run("sockets.user.remove-from-group:" + name + "\n   group:team");
            Assert.Equal(new[] { ("remove", "g1", "group:team"), ("remove", "g2", "group:team") }, hub2.Groups.ToArray());
        }

        [Fact]
        public async Task UserGroupSlotsRequireGroup()
        {
            await Assert.ThrowsAsync<HyperlambdaException>(() => Run("sockets.user.add-to-group:john"));
            await Assert.ThrowsAsync<HyperlambdaException>(() => Run("sockets.user.remove-from-group:john"));
        }

        [Fact]
        public async Task ConnectionCanEnterAndLeaveGroup()
        {
            var fake = new FakeHub();
            var signaler = Common.GetSignaler(fake);
            await signaler.ScopeAsync("dynamic.sockets.connection", "conn-1", async () =>
            {
                var enter = HyperlambdaParser.Parse("sockets.connection.enter-group\n   group:room");
                await signaler.SignalAsync("eval", enter);
                var leave = HyperlambdaParser.Parse("sockets.connection.leave-group\n   group:room");
                await signaler.SignalAsync("eval", leave);
            });
            Assert.Equal(new[] { ("add", "conn-1", "group:room"), ("remove", "conn-1", "group:room") }, fake.Groups.ToArray());
        }

        [Fact]
        public async Task ConnectionGroupSlotsOutsideSocketThrow()
        {
            await Assert.ThrowsAsync<HyperlambdaException>(() => Run("sockets.connection.enter-group\n   group:room"));
            await Assert.ThrowsAsync<HyperlambdaException>(() => Run("sockets.connection.leave-group\n   group:room"));
        }

        [Fact]
        public async Task ConnectionGroupSlotsRequireGroupAndNoValue()
        {
            var signaler = Common.GetSignaler(new FakeHub());
            await signaler.ScopeAsync("dynamic.sockets.connection", "conn-1", async () =>
            {
                await Assert.ThrowsAsync<HyperlambdaException>(
                    () => signaler.SignalAsync("eval", HyperlambdaParser.Parse("sockets.connection.enter-group")));
                await Assert.ThrowsAsync<HyperlambdaException>(
                    () => signaler.SignalAsync("eval", HyperlambdaParser.Parse("sockets.connection.enter-group:foo\n   group:room")));
            });
        }
    }
}
