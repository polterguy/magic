/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Collections.Generic;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using magic.node;
using magic.node.services;
using magic.node.contracts;
using magic.signals.services;
using magic.signals.contracts;
using magic.node.extensions.hyperlambda;

namespace magic.lambda.crypto.tests
{
    public static class Common
    {
        static public Node Evaluate(string hl)
        {
            var services = Initialize();
            var lambda = HyperlambdaParser.Parse(hl);
            var signaler = services.GetService(typeof(ISignaler)) as ISignaler;
            signaler.Signal("eval", lambda);
            return lambda;
        }

        static public string PrivateKey
        {
            get
            {
                return @"-----BEGIN PGP PRIVATE KEY BLOCK-----

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
=IQdP
-----END PGP PRIVATE KEY BLOCK-----
-----BEGIN PGP PUBLIC KEY BLOCK-----

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
jqlytqgW6l6KI/Q=
=9VzI
-----END PGP PUBLIC KEY BLOCK-----";
            }
        }

        #region [ -- Private helper methods -- ]

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

        static IServiceProvider Initialize()
        {
            var services = new ServiceCollection();
            services.AddTransient<ISignaler, Signaler>();
            services.AddTransient<IStreamService, StreamService>();
            services.AddTransient<IFileService, FileService>();
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
