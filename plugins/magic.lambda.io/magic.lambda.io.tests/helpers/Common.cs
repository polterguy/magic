/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.Extensions.DependencyInjection;
using magic.node;
using magic.node.contracts;
using magic.signals.services;
using magic.signals.contracts;
using magic.node.extensions.hyperlambda;

namespace magic.lambda.io.tests.helpers
{
    public static class Common
    {
        private class RootResolver : IRootResolver
        {
            public string DynamicFiles => AppDomain.CurrentDomain.BaseDirectory;
            public string RootFolder => AppDomain.CurrentDomain.BaseDirectory;

            public string AbsolutePath(string path)
            {
                return DynamicFiles + path.TrimStart(new char[] { '/', '\\' });
            }

            public string RelativePath(string path)
            {
                return path.Substring(DynamicFiles.Length - 1);
            }
        }

        static public Node Evaluate(
            string hl,
            FileService fileService = null,
            FolderService folderService = null,
            StreamService streamService = null)
        {
            var services = Initialize(fileService, folderService, streamService);
            var lambda = HyperlambdaParser.Parse(hl);
            var signaler = services.GetService(typeof(ISignaler)) as ISignaler;
            signaler.Signal("eval", lambda);
            return lambda;
        }

        static public async Task<Node> EvaluateAsync(
            string hl,
            FileService fileService = null,
            FolderService folderService = null,
            StreamService streamService = null)
        {
            var services = Initialize(fileService, folderService, streamService);
            var lambda = HyperlambdaParser.Parse(hl);
            var signaler = services.GetService(typeof(ISignaler)) as ISignaler;
            await signaler.SignalAsync("eval", lambda);
            return lambda;
        }

        #region [ -- Private helper methods -- ]

        static IServiceProvider Initialize(
            FileService fileService = null,
            FolderService folderService = null,
            StreamService streamService = null)
        {
            var services = new ServiceCollection();
            services.AddTransient<ISignaler, Signaler>();
            if (fileService == null)
                services.AddTransient<IFileService, FileService>();
            else
                services.AddTransient<IFileService>(svc => fileService);
            if (folderService == null)
                services.AddTransient<IFolderService, FolderService>();
            else
                services.AddTransient<IFolderService>(svc => folderService);
            if (streamService == null)
                services.AddTransient<IStreamService, StreamService>();
            else
                services.AddTransient<IStreamService>(svc => streamService);
            services.AddTransient<IRootResolver, RootResolver>();
            var types = new SignalsProvider(InstantiateAllTypes<ISlot, ISlotAsync>(services));
            services.AddTransient<ISignalsProvider>((svc) => types);
            var provider = services.BuildServiceProvider();
            return provider;
        }

        static IEnumerable<Type> InstantiateAllTypes<T1, T2>(ServiceCollection services)
        {
            var type1 = typeof(T1);
            var type2 = typeof(T2);
            var result = AppDomain.CurrentDomain.GetAssemblies()
                .Where(x => !x.IsDynamic && !x.FullName.StartsWith("Microsoft", StringComparison.InvariantCulture))
                .SelectMany(s => s.GetTypes())
                .Where(p => (type1.IsAssignableFrom(p) || type2.IsAssignableFrom(p)) && !p.IsInterface && !p.IsAbstract);

            foreach (var idx in result)
            {
                services.AddTransient(idx);
            }
            return result;
        }

        #endregion
    }
}
