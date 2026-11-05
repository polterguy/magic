/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System;
using System.Linq;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Xunit;
using magic.node;
using magic.node.contracts;
using magic.node.extensions;
using magic.signals.services;
using magic.signals.contracts;
using magic.lambda.config.services;

namespace magic.lambda.config.tests
{
    public class ConfigFileTests
    {
        static readonly string[] SectionKeys = ["default", "other"];
        static readonly string[] SectionValues = ["en", "no"];

        readonly Mock<IFileService> _files = new();
        readonly Mock<IMagicConfiguration> _configuration = new();

        ISignaler GetSignaler()
        {
            var services = new ServiceCollection();
            services.AddTransient<ISignaler, Signaler>();
            var resolver = new Mock<IRootResolver>();
            resolver.SetupGet(x => x.RootFolder).Returns("/root/");
            services.AddSingleton(resolver.Object);
            services.AddSingleton(_files.Object);
            services.AddSingleton(_configuration.Object);
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

        [Fact]
        public async Task LoadReturnsAppSettingsFile()
        {
            _files.Setup(x => x.LoadAsync("/root/files/config/appsettings.json")).ReturnsAsync("{\"foo\":1}");
            var node = new Node("config.load");
            await GetSignaler().SignalAsync("config.load", node);
            Assert.Equal("{\"foo\":1}", node.Value);
        }

        [Fact]
        public async Task SaveWritesReformattedJson()
        {
            string saved = null;
            _files
                .Setup(x => x.SaveAsync("/root/files/config/appsettings.json", It.IsAny<string>()))
                .Callback((string _, string content) => saved = content)
                .Returns(Task.CompletedTask);
            var node = new Node("config.save", "{\"foo\":{\"bar\":1}}");
            await GetSignaler().SignalAsync("config.save", node);
            Assert.NotNull(saved);
            Assert.Contains("\"foo\"", saved);
            Assert.Contains("\"bar\": 1", saved);
        }

        [Fact]
        public void SectionReturnsKeysAndValuesAsChildren()
        {
            _configuration.Setup(x => x.GetSection("magic:culture")).Returns(new Dictionary<string, string>
            {
                ["default"] = "en",
                ["other"] = "no",
            });
            var node = new Node("config.section", "magic:culture");
            GetSignaler().Signal("config.section", node);
            Assert.Equal(SectionKeys, node.Children.Select(x => x.Name).ToArray());
            Assert.Equal(SectionValues, node.Children.Select(x => x.Get<string>()).ToArray());
        }

        [Fact]
        public void SectionWithoutValueThrows()
        {
            Assert.Throws<HyperlambdaException>(() => GetSignaler().Signal("config.section", new Node("config.section")));
        }

        [Fact]
        public void MagicConfigurationReadsKeysAndSections()
        {
            var configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string>
                {
                    ["magic:a"] = "1",
                    ["magic:b"] = "2",
                    ["other"] = "x",
                })
                .Build();
            var magic = new MagicConfiguration(configuration);
            Assert.Equal("x", magic["other"]);
            Assert.Null(magic["missing"]);
            var section = magic.GetSection("magic");
            Assert.Equal(2, section.Count);
            Assert.Equal("1", section["a"]);
            Assert.Equal("2", section["b"]);
            Assert.Empty(magic.GetSection("nothing"));
        }
    }
}
