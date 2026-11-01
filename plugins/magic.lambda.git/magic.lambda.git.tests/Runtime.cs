/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Collections.Generic;
using System.Diagnostics;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Xunit;
using magic.node;
using magic.node.contracts;
using magic.signals.services;
using magic.signals.contracts;

namespace magic.lambda.git.tests
{
    /*
     * A fact that only runs when git is installed, which every slot of the plugin needs.
     */
    public sealed class GitFactAttribute : FactAttribute
    {
        static readonly bool _hasGit = HasGit();

        public GitFactAttribute()
        {
            if (!_hasGit)
                Skip = "git is not installed";
        }

        static bool HasGit()
        {
            try
            {
                using var process = Process.Start(new ProcessStartInfo("git", "--version") { RedirectStandardOutput = true, RedirectStandardError = true });
                process.WaitForExit();
                return process.ExitCode == 0;
            }
            catch
            {
                return false;
            }
        }
    }

    /*
     * Evaluates the slots against a dynamic files folder of their own, which is deleted again when the test is done.
     */
    public sealed class Runtime : IDisposable
    {
        public const string Identity = "tester";

        readonly ISignaler _signaler;

        public Runtime(HttpMessageHandler handler = null, Dictionary<string, string> configuration = null)
        {
            Root = Path.Combine(Path.GetTempPath(), "magic-git-tests-" + Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(Root);

            _ = typeof(magic.lambda.json.slots.json.Json2Lambda);
            _ = typeof(magic.lambda.git.GitStatus);

            var services = new ServiceCollection();
            services.AddTransient<ISignaler, Signaler>();
            var resolver = new Mock<IRootResolver>();
            resolver.SetupGet(x => x.DynamicFiles).Returns(Root + "/");
            resolver.SetupGet(x => x.RootFolder).Returns(Root + "/");
            resolver.Setup(x => x.AbsolutePath(It.IsAny<string>())).Returns<string>(x => Root + "/" + x.TrimStart('/'));
            services.AddSingleton(resolver.Object);
            services.AddSingleton<IConfiguration>(new ConfigurationBuilder().AddInMemoryCollection(configuration ?? new Dictionary<string, string>()).Build());
            services.AddSingleton(handler == null ? new HttpClient() : new HttpClient(handler));

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
            _signaler = services.BuildServiceProvider().GetService<ISignaler>();
        }

        public string Root { get; }

        public string FullPath(string relative) => Path.Combine(Root, relative.Trim('/'));

        public async Task<Node> Call(string slot, string value, params (string Name, object Value)[] args)
        {
            var node = new Node(slot, value);
            foreach (var (name, argValue) in args)
            {
                node.Add(new Node(name, argValue));
            }
            await _signaler.SignalAsync(slot, node);
            return node;
        }

        /*
         * Makes a repository on the branch main, in the folder, with a commit of the file.
         */
        public async Task<string> Repo(string folder, string file = "a.txt", string content = "one")
        {
            await Call("git.create-repo", folder, ("branch", "main"));
            File.WriteAllText(Path.Combine(FullPath(folder), file), content);
            await Commit(folder, "first");
            return FullPath(folder);
        }

        public async Task<Node> Commit(string folder, string message)
        {
            return await Call("git.commit", folder, ("message", message), ("name", Identity), ("email", Identity + "@example.com"));
        }

        public void Dispose()
        {
            try
            {
                foreach (var file in Directory.EnumerateFiles(Root, "*", SearchOption.AllDirectories))
                {
                    File.SetAttributes(file, FileAttributes.Normal);
                }
                Directory.Delete(Root, true);
            }
            catch
            {
                // Best effort, the folder is in the system's temp folder.
            }
            GC.SuppressFinalize(this);
        }
    }
}
