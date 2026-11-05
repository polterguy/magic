/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System;
using System.Linq;
using Microsoft.Extensions.DependencyInjection;
using magic.node;
using magic.node.extensions;
using magic.signals.services;
using magic.signals.contracts;

namespace magic.lambda.pdf.tests
{
    /*
     * Stands in for [io.file.load.binary], recording what it was asked to load.
     */
    [Slot(Name = "io.file.load.binary")]
    public class StubLoadBinary : ISlot
    {
        public static string Requested { get; set; }
        public static byte[] Content { get; set; } = Array.Empty<byte>();

        public void Signal(ISignaler signaler, Node input)
        {
            Requested = input.GetEx<string>();
            input.Value = Content;
        }
    }

    /*
     * Stands in for [http.get], recording what it was asked to retrieve.
     */
    [Slot(Name = "http.get")]
    public class StubHttpGet : ISlot
    {
        public static string Requested { get; set; }
        public static byte[] Content { get; set; } = Array.Empty<byte>();
        public static bool OmitContent { get; set; }

        public void Signal(ISignaler signaler, Node input)
        {
            Requested = input.GetEx<string>();
            if (!OmitContent)
                input.Add(new Node("content", Content));
        }
    }

    public static class Common
    {
        /// <summary>
        /// A 1x1 PNG image.
        /// </summary>
        public static readonly byte[] Png = Convert.FromBase64String(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==");

        public static ISignaler GetSignaler()
        {
            _ = typeof(Html2Pdf);
            var services = new ServiceCollection();
            services.AddTransient<ISignaler, Signaler>();
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

        public static byte[] Pdf(string html)
        {
            var node = new Node("html2pdf", html);
            GetSignaler().Signal("html2pdf", node);
            return node.Get<byte[]>();
        }
    }
}
