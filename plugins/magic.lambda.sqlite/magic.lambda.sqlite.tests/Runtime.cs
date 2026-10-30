/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using magic.node;
using magic.node.contracts;
using magic.node.extensions;
using magic.data.common.contracts;
using magic.signals.services;
using magic.signals.contracts;
using magic.node.extensions.hyperlambda;

namespace magic.lambda.sqlite.tests
{
    /*
     * Evaluates Hyperlambda against a real SQLite database, living in a folder of its own that is
     * deleted again when the test is done.
     */
    public sealed class Runtime : IDisposable
    {
        readonly string _folder = Path.Combine(Path.GetTempPath(), "magic-sqlite-tests-" + Guid.NewGuid().ToString("N"));

        public Runtime()
        {
            Directory.CreateDirectory(_folder);
        }

        /// <summary>
        /// Name of the database the tests connect to, as [generic|name].
        /// </summary>
        public string Database => "[generic|testdb]";

        public async Task<Node> EvaluateAsync(string hl)
        {
            var lambda = HyperlambdaParser.Parse(hl.Replace("{db}", Database));
            await BuildSignaler().SignalAsync("eval", lambda);
            return lambda;
        }

        /// <summary>
        /// Invokes the specified slot directly, which is how slots with names starting with a period are invoked.
        /// </summary>
        public async Task<Node> SignalAsync(string slot)
        {
            var node = new Node(slot);
            await BuildSignaler().SignalAsync(slot, node);
            return node;
        }

        ISignaler BuildSignaler()
        {
            var services = new ServiceCollection();
            services.AddTransient<ISignaler, Signaler>();

            var resolver = new Mock<IRootResolver>();
            resolver.SetupGet(x => x.DynamicFiles).Returns(_folder + "/");
            resolver.SetupGet(x => x.RootFolder).Returns(_folder + "/");
            resolver.Setup(x => x.AbsolutePath(It.IsAny<string>())).Returns<string>(x => _folder + "/" + x.TrimStart('/'));
            services.AddSingleton(resolver.Object);

            var settings = new Mock<IDataSettings>();
            settings.SetupGet(x => x.DefaultDatabaseType).Returns("sqlite");
            settings
                .Setup(x => x.ConnectionString(It.IsAny<string>(), It.IsAny<string>()))
                .Returns("Data Source=" + _folder + "/{database}.db;Pooling=false");
            services.AddSingleton(settings.Object);

            var types = new SignalsProvider(InstantiateAllTypes(services));
            services.AddTransient<ISignalsProvider>(svc => types);

            return services.BuildServiceProvider().GetService<ISignaler>();
        }

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

        #region [ -- Private helper methods -- ]

        static IEnumerable<Type> InstantiateAllTypes(ServiceCollection services)
        {
            var type1 = typeof(ISlot);
            var type2 = typeof(ISlotAsync);
            var result = AppDomain.CurrentDomain.GetAssemblies()
                .Where(x => !x.IsDynamic && !x.FullName.StartsWith("Microsoft", StringComparison.InvariantCulture))
                .SelectMany(s => s.GetTypes())
                .Where(p => (type1.IsAssignableFrom(p) || type2.IsAssignableFrom(p)) && !p.IsInterface && !p.IsAbstract)
                .ToList();

            foreach (var idx in result)
            {
                services.AddTransient(idx);
            }
            return result;
        }

        #endregion
    }
}
