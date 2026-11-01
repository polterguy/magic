/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using Microsoft.Extensions.DependencyInjection;
using magic.signals.services;
using magic.signals.contracts;

namespace magic.lambda.openai.tests
{
    public static class Common
    {
        /*
         * Returns a signaler that knows about every slot in the loaded assemblies, [json2lambda] included.
         */
        public static ISignaler GetSignaler()
        {
            _ = typeof(magic.lambda.json.slots.json.Json2Lambda);
            _ = typeof(Tokenizer);
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
    }
}
