/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System;
using System.Linq;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Xunit;
using PuppeteerSharp;
using magic.node;
using magic.node.contracts;
using magic.signals.services;
using magic.signals.contracts;
using magic.node.extensions.hyperlambda;

namespace magic.lambda.puppeteer.tests
{
    /*
     * Sessions live in a static dictionary capped at five, so every class touching them runs in this collection,
     * which xUnit never runs in parallel with itself.
     */
    [CollectionDefinition(Name)]
    public class SessionsCollection
    {
        public const string Name = "puppeteer-sessions";
    }

    /*
     * A session made of mocked browser and page, which is closed again when the test is done.
     */
    internal sealed class FakeSession : IDisposable
    {
        public Mock<IBrowser> Browser { get; } = new();

        public Mock<IPage> Page { get; } = new();

        public PuppeteerSession Session { get; }

        public string Id => Session.Id;

        public FakeSession(int? timeoutMinutes = null, int? maxLifetimeMinutes = null)
        {
            Page.SetupGet(x => x.IsClosed).Returns(false);
            Page.Setup(x => x.CloseAsync(It.IsAny<PageCloseOptions>())).Returns(Task.CompletedTask);
            Browser.SetupGet(x => x.IsClosed).Returns(false);
            Browser.Setup(x => x.CloseAsync()).Returns(Task.CompletedTask);
            Session = PuppeteerSessions.Create(Browser.Object, Page.Object, timeoutMinutes, maxLifetimeMinutes);
        }

        public void Dispose()
        {
            PuppeteerSessions.CloseAsync(Id).GetAwaiter().GetResult();
        }
    }

    public static class Common
    {
        public static ISignaler GetSignaler(Action<ServiceCollection> configure = null)
        {
            _ = typeof(Goto);
            var services = new ServiceCollection();
            services.AddTransient<ISignaler, Signaler>();
            var resolver = new Mock<IRootResolver>();
            resolver.SetupGet(x => x.RootFolder).Returns(System.IO.Path.GetTempPath());
            resolver.SetupGet(x => x.DynamicFiles).Returns(System.IO.Path.GetTempPath());
            resolver.Setup(x => x.AbsolutePath(It.IsAny<string>())).Returns<string>(x => System.IO.Path.Combine(System.IO.Path.GetTempPath(), x.TrimStart('/')));
            services.AddSingleton(resolver.Object);
            configure?.Invoke(services);

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

        public static async Task<Node> EvaluateAsync(string hl, ISignaler signaler = null)
        {
            var lambda = HyperlambdaParser.Parse(hl);
            await (signaler ?? GetSignaler()).SignalAsync("eval", lambda);
            return lambda;
        }
    }
}
