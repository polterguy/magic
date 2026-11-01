/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using magic.node;
using magic.node.extensions;
using magic.backend.slots;
using magic.signals.services;
using magic.signals.contracts;
using Version = magic.backend.slots.Version;

namespace backend.tests
{
    /*
     * The slots of the backend itself. The console and the time zone setting are shared by the whole process,
     * which is why the tests touching them are not allowed to run beside each other.
     */
    [Collection("process-wide state")]
    public sealed class BackendSlotTests : IDisposable
    {
        static readonly string[] SlotNames = ["console.log", "timezone.init", "version"];

        readonly string _timeZone = Converter.DefaultTimeZone;

        public void Dispose()
        {
            Converter.DefaultTimeZone = _timeZone;
            GC.SuppressFinalize(this);
        }

        static IConfiguration Configuration(string timeZone)
        {
            var values = new Dictionary<string, string>();
            if (timeZone != null)
                values["magic:culture:defaultTimeZone"] = timeZone;
            return new ConfigurationBuilder().AddInMemoryCollection(values).Build();
        }

        [Fact]
        public void VersionLooksLikeAReleaseTag()
        {
            var node = new Node("version");
            new Version().Signal(null, node);
            Assert.Matches(@"^v\d+\.\d+\.\d+$", node.Get<string>());
        }

        [Fact]
        public void ConsoleLogWritesTheMessage()
        {
            var original = Console.Out;
            using var writer = new StringWriter();
            Console.SetOut(writer);
            try
            {
                new ConsoleLog().Signal(null, new Node("console.log", "hello from the test"));
            }
            finally
            {
                Console.SetOut(original);
            }
            Assert.Equal("hello from the test" + Environment.NewLine, writer.ToString());
        }

        [Theory]
        [InlineData("UTC", "utc")]
        [InlineData("Local", "local")]
        [InlineData("none", "none")]
        public void TimeZoneIsReadFromTheConfigurationInLowerCase(string configured, string expected)
        {
            new InitTimeZone(Configuration(configured)).Signal(null, new Node("timezone.init"));
            Assert.Equal(expected, Converter.DefaultTimeZone);
        }

        [Fact]
        public void TimeZoneDefaultsToNone()
        {
            Converter.DefaultTimeZone = "utc";
            new InitTimeZone(Configuration(null)).Signal(null, new Node("timezone.init"));
            Assert.Equal("none", Converter.DefaultTimeZone);
        }

        [Fact]
        public async Task TheSlotsAreRegisteredUnderTheirNames()
        {
            var services = new ServiceCollection();
            services.AddTransient<ISignaler, Signaler>();
            services.AddSingleton(Configuration("utc"));
            var types = new[] { typeof(Version), typeof(ConsoleLog), typeof(InitTimeZone) };
            foreach (var type in types)
            {
                services.AddTransient(type);
            }
            var provider = new SignalsProvider(types);
            services.AddSingleton<ISignalsProvider>(provider);
            var signaler = services.BuildServiceProvider().GetService<ISignaler>();

            Assert.Equal(SlotNames, types.Select(x => x.GetCustomAttribute<SlotAttribute>().Name).OrderBy(x => x).ToArray());
            var node = new Node("version");
            await signaler.SignalAsync("version", node);
            Assert.StartsWith("v", node.Get<string>());
            await signaler.SignalAsync("timezone.init", new Node("timezone.init"));
            Assert.Equal("utc", Converter.DefaultTimeZone);
        }
    }
}
