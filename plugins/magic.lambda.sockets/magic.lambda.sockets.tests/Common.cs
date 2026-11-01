/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Threading;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using magic.node;
using magic.node.extensions;
using magic.signals.services;
using magic.signals.contracts;

namespace magic.lambda.sockets.tests
{
    /*
     * Stands in for [auth.ticket.get], returning the user and roles of whoever the test says is connected.
     */
    [Slot(Name = "auth.ticket.get")]
    public class StubTicket : ISlot
    {
        public static string Username;
        public static string[] Roles = Array.Empty<string>();

        public void Signal(ISignaler signaler, Node input)
        {
            input.Value = Username;
            var roles = new Node("roles");
            roles.AddRange(Roles.Select(x => new Node(".", x)));
            input.Add(roles);
        }
    }

    /*
     * Records that it was invoked and the socket connection it was invoked from.
     */
    [Slot(Name = "test.sockets.record")]
    public class StubRecord : ISlot
    {
        public static string Connection;
        public static string Payload;

        public void Signal(ISignaler signaler, Node input)
        {
            Connection = signaler.Peek<string>("dynamic.sockets.connection");
            Payload = input.GetEx<string>();
        }
    }

    [Slot(Name = "test.sockets.throw")]
    public class StubThrow : ISlot
    {
        public void Signal(ISignaler signaler, Node input)
        {
            throw new HyperlambdaException("boom");
        }
    }

    /*
     * A SignalR hub context recording everything sent through it, and every change to a group.
     */
    public sealed class FakeHub
    {
        public List<(string Target, string[] Names, string Method, object Argument)> Sent { get; } = new();

        public List<(string Operation, string Connection, string Group)> Groups { get; } = new();

        public Mock<IHubContext<MagicHub>> Context { get; } = new();

        public Mock<IGroupManager> GroupManager { get; } = new();

        public FakeHub()
        {
            var clients = new Mock<IHubClients>();
            clients.SetupGet(x => x.All).Returns(Proxy("all", null));
            clients.Setup(x => x.Users(It.IsAny<IReadOnlyList<string>>())).Returns((IReadOnlyList<string> n) => Proxy("users", n));
            clients.Setup(x => x.Groups(It.IsAny<IReadOnlyList<string>>())).Returns((IReadOnlyList<string> n) => Proxy("groups", n));
            clients.Setup(x => x.Clients(It.IsAny<IReadOnlyList<string>>())).Returns((IReadOnlyList<string> n) => Proxy("clients", n));
            Context.SetupGet(x => x.Clients).Returns(clients.Object);

            GroupManager
                .Setup(x => x.AddToGroupAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
                .Callback((string c, string g, CancellationToken _) => Groups.Add(("add", c, g)))
                .Returns(Task.CompletedTask);
            GroupManager
                .Setup(x => x.RemoveFromGroupAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
                .Callback((string c, string g, CancellationToken _) => Groups.Add(("remove", c, g)))
                .Returns(Task.CompletedTask);
            Context.SetupGet(x => x.Groups).Returns(GroupManager.Object);
        }

        IClientProxy Proxy(string target, IReadOnlyList<string> names)
        {
            var proxy = new Mock<IClientProxy>();
            proxy
                .Setup(x => x.SendCoreAsync(It.IsAny<string>(), It.IsAny<object[]>(), It.IsAny<CancellationToken>()))
                .Callback((string m, object[] a, CancellationToken _) => Sent.Add((target, names?.ToArray(), m, a[0])))
                .Returns(Task.CompletedTask);
            return proxy.Object;
        }
    }

    public static class Common
    {
        public static ISignaler GetSignaler(FakeHub hub, bool enabled = true)
        {
            _ = typeof(magic.lambda.json.slots.json.Json2Lambda);
            _ = typeof(MagicHub);

            var services = new ServiceCollection();
            services.AddTransient<ISignaler, Signaler>();
            services.AddSingleton<IConfiguration>(new ConfigurationBuilder()
                .AddInMemoryCollection(enabled ?
                    new Dictionary<string, string> { ["magic:sockets:url"] = "/sockets" } :
                    new Dictionary<string, string>())
                .Build());
            services.AddSingleton(hub.Context.Object);

            var type1 = typeof(ISlot);
            var type2 = typeof(ISlotAsync);
            var types = AppDomain.CurrentDomain.GetAssemblies()
                .Where(x => !x.IsDynamic && !x.FullName.StartsWith("Microsoft", StringComparison.InvariantCulture))
                .SelectMany(s => s.GetTypes())
                .Where(p => (type1.IsAssignableFrom(p) || type2.IsAssignableFrom(p)) && !p.IsInterface && !p.IsAbstract)
                .ToList();
            foreach (var idx in types)
            {
                services.AddTransient(idx);
            }
            var provider = new SignalsProvider(types);
            services.AddTransient<ISignalsProvider>(svc => provider);
            return services.BuildServiceProvider().GetService<ISignaler>();
        }
    }
}
