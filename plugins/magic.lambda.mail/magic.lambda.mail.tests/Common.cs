/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.Extensions.DependencyInjection;
using magic.node;
using magic.node.services;
using magic.node.contracts;
using magic.signals.services;
using magic.signals.contracts;
using magic.lambda.mail.contracts;
using magic.lambda.mail.tests.helpers;
using magic.node.extensions.hyperlambda;
using magic.lambda.mail.contracts.settings;

namespace magic.lambda.mail.tests
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
            MockSmtpClient smtp = null,
            MockPop3Client pop3 = null)
        {
            var services = Initialize(smtp, pop3);
            var lambda = HyperlambdaParser.Parse(hl);
            var signaler = services.GetService(typeof(ISignaler)) as ISignaler;
            signaler.Signal("eval", lambda);
            return lambda;
        }

        static public async Task<Node> EvaluateAsync(
            string hl,
            MockSmtpClient smtp,
            MockPop3Client pop3 = null)
        {
            var services = Initialize(smtp, pop3);
            var lambda = HyperlambdaParser.Parse(hl);
            var signaler = services.GetService(typeof(ISignaler)) as ISignaler;
            await signaler.SignalAsync("eval", lambda);
            return lambda;
        }

        static public ISignaler GetSignaler(MockSmtpClient smtp, MockPop3Client pop3)
        {
            var services = Initialize(smtp, pop3);
            return services.GetService(typeof(ISignaler)) as ISignaler;
        }

        #region [ -- Private helper methods -- ]

        static IServiceProvider Initialize(MockSmtpClient smtp, MockPop3Client pop3)
        {
            var services = new ServiceCollection();
            services.AddTransient<ISignaler, Signaler>();
            services.AddTransient<IRootResolver, RootResolver>();
            if (smtp != null)
                services.AddTransient<ISmtpClient>((svc) => smtp);
            if (pop3 != null)
                services.AddTransient<IPop3Client>((svc) => pop3);

            var types = new SignalsProvider(InstantiateAllTypes<ISlot, ISlotAsync>(services));
            services.AddTransient<ISignalsProvider>((svc) => types);
            services.AddTransient<IStreamService, StreamService>();
            services.AddTransient<IFileService, FileService>();
            services.AddTransient<ConnectionSettingsSmtp>((svc) => new ConnectionSettingsSmtp
            {
                Host = "foo2.com",
                Port = 321,
                Secure = false,
                Username = "xxx2",
                Password = "yyy2",
                From = new Sender
                {
                    Name = "Foo Bar",
                    Address = "foo@bar.com",
                }
            });
            services.AddTransient((svc) => new ConnectionSettingsPop3
            {
                Host = "foo2.com",
                Port = 321,
                Secure = false,
                Username = "xxx2",
                Password = "yyy2"
            });

            return services.BuildServiceProvider();
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
