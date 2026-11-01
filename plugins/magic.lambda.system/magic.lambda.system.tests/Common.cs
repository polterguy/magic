/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.IO;
using System.Linq;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using magic.node.contracts;
using magic.signals.services;
using magic.signals.contracts;

namespace magic.lambda.system.tests
{
    /*
     * A signaler that knows about every slot in the loaded assemblies, whose root folder is a folder of its own.
     */
    public sealed class Runtime : IDisposable
    {
        readonly string _folder = Path.Combine(Path.GetTempPath(), "magic-system-tests-" + Guid.NewGuid().ToString("N"));

        public Runtime()
        {
            Directory.CreateDirectory(_folder);
            _ = typeof(magic.lambda.system.terminal.TerminalExecute);
            _ = typeof(magic.lambda.slots.Return);

            var services = new ServiceCollection();
            services.AddTransient<ISignaler, Signaler>();

            var resolver = new Mock<IRootResolver>();
            resolver.SetupGet(x => x.RootFolder).Returns(_folder + "/");
            resolver.SetupGet(x => x.DynamicFiles).Returns(_folder + "/");
            resolver.Setup(x => x.AbsolutePath(It.IsAny<string>())).Returns<string>(x => Path.Combine(_folder, x.TrimStart('/')));
            services.AddSingleton(resolver.Object);

            var type1 = typeof(ISlot);
            var type2 = typeof(ISlotAsync);
            var types = AppDomain.CurrentDomain.GetAssemblies()
                .Where(x => !x.IsDynamic && x.Location.Length > 0 && !x.FullName.StartsWith("Microsoft", StringComparison.InvariantCulture))
                .SelectMany(s => s.GetTypes())
                .Where(p => (type1.IsAssignableFrom(p) || type2.IsAssignableFrom(p)) && !p.IsInterface && !p.IsAbstract)
                .ToList();
            foreach (var idx in types)
            {
                services.AddTransient(idx);
            }
            Provider = new SignalsProvider(types);
            services.AddSingleton<ISignalsProvider>(Provider);
            Signaler = services.BuildServiceProvider().GetService<ISignaler>();
        }

        public ISignaler Signaler { get; }

        public SignalsProvider Provider { get; }

        public string Folder => _folder;

        public void Dispose()
        {
            try
            {
                Directory.Delete(_folder, true);
            }
            catch
            {
                // Best effort, the folder is in the system's temp folder.
            }
        }
    }
}
