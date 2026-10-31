/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using System.Diagnostics;
using System.Collections.Generic;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Cors.Infrastructure;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Xunit;
using magic.node;
using magic.node.contracts;
using magic.signals.contracts;
using magic.endpoint.contracts;
using magic.data.common.contracts;
using magic.lambda.auth.contracts;
using magic.lambda.logging.contracts;
using magic.lambda.caching.contracts;
using magic.lambda.mail.contracts;
using magic.lambda.scheduler.contracts;
using magic.lambda.http.contracts;

namespace magic.library.tests
{
    /*
     * Tests that Magic wires itself up the way it is supposed to, by building a real service provider from
     * the real Initializer, and using what comes out of it.
     */
    public sealed class InitializerTests : IDisposable
    {
        readonly string _folder = Path.Combine(Path.GetTempPath(), "magic-library-tests-" + Guid.NewGuid().ToString("N"));

        public InitializerTests()
        {
            Directory.CreateDirectory(_folder);
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

        IConfiguration Configuration(Dictionary<string, string> extra = null)
        {
            var values = new Dictionary<string, string>
            {
                ["magic:io:root-folder"] = _folder + "/",
                ["magic:auth:secret"] = "a-secret-long-enough-for-the-tests",
            };
            foreach (var idx in extra ?? [])
            {
                values[idx.Key] = idx.Value;
            }
            return new ConfigurationBuilder().AddInMemoryCollection(values).Build();
        }

        static ServiceProvider Build(IConfiguration configuration, Action<IServiceCollection> before = null)
        {
            var services = new ServiceCollection();
            services.AddLogging();
            services.AddSingleton(new DiagnosticListener("Microsoft.AspNetCore"));
            services.AddSingleton<DiagnosticSource>(x => x.GetService<DiagnosticListener>());
            before?.Invoke(services);
            services.AddMagic(configuration);
            return services.BuildServiceProvider();
        }

        #region [ -- Wiring -- ]

        [Fact]
        public void CoreServicesAreWired()
        {
            using var provider = Build(Configuration());
            using var scope = provider.CreateScope();
            var sp = scope.ServiceProvider;
            foreach (var type in new[]
            {
                typeof(ISignaler), typeof(ISignalsProvider), typeof(IExecutionRegistry),
                typeof(IDataSettings), typeof(IFileService), typeof(IFolderService), typeof(IStreamService), typeof(IRootResolver),
                typeof(IMagicConfiguration), typeof(IMagicCache),
                typeof(ILogger), typeof(ILogQuery), typeof(LogSettings),
                typeof(IHttpArgumentsHandler),
                typeof(Initializer).Assembly.GetType("magic.library.internals.IExceptionHandler"),
                typeof(ITicketProvider), typeof(IAuthSettings),
                typeof(ITaskScheduler), typeof(ITaskStorage),
                typeof(ISmtpClient), typeof(IPop3Client),
                typeof(ICorsPolicyProvider),
            })
            {
                Assert.True(sp.GetService(type) != null, type.Name + " is not wired");
            }
        }

        [Fact]
        public void RootResolverUsesTheConfiguredFolder()
        {
            using var provider = Build(Configuration());
            var resolver = provider.GetService<IRootResolver>();
            Assert.Equal(_folder + "/", resolver.DynamicFiles);
            Assert.Equal(_folder + "/foo/bar.hl", resolver.AbsolutePath("/foo/bar.hl"));
            Assert.Equal("/foo/bar.hl", resolver.RelativePath(_folder + "/foo/bar.hl"));
        }

        [Fact]
        public void SchedulerAndStorageAreTheSameInstance()
        {
            using var provider = Build(Configuration());
            Assert.Same(provider.GetService<ITaskScheduler>(), provider.GetService<ITaskScheduler>());
            Assert.NotNull(provider.GetService<IServiceCreator<ISignaler>>().Create());
            Assert.NotNull(provider.GetService<IServiceCreator<ILogger>>().Create());
            Assert.NotNull(provider.GetService<IServiceCreator<IDataSettings>>().Create());
        }

        [Fact]
        public void EverySlotCanBeCreated()
        {
            // The sockets slots need SignalR, which Magic only wires up when sockets are configured.
            using var provider = Build(Configuration(new() { ["magic:sockets:url"] = "/sockets" }));
            using var scope = provider.CreateScope();
            var slots = AppDomain.CurrentDomain.GetAssemblies()
                .Where(x => !x.IsDynamic && !x.FullName.StartsWith("Microsoft", StringComparison.Ordinal) && !x.FullName.StartsWith("System", StringComparison.Ordinal))
                .SelectMany(x => x.GetTypes())
                .Where(x => (typeof(ISlot).IsAssignableFrom(x) || typeof(ISlotAsync).IsAssignableFrom(x)) && !x.IsInterface && !x.IsAbstract)
                .ToList();
            Assert.True(slots.Count > 200, "Expected hundreds of slots, found " + slots.Count);

            var broken = new List<string>();
            foreach (var type in slots)
            {
                try
                {
                    if (scope.ServiceProvider.GetService(type) == null)
                        broken.Add(type.FullName + " is not registered");
                }
                catch (Exception error)
                {
                    broken.Add(type.FullName + ": " + error.Message);
                }
            }
            Assert.True(broken.Count == 0, "Slots that cannot be created:\n" + string.Join("\n", broken));
        }

        [Fact]
        public void ServiceTypesCanBeChangedInConfiguration()
        {
            using var provider = Build(Configuration(new()
            {
                ["magic:io:file-service"] = "magic.node.services.FileService",
                ["magic:logging:service"] = "magic.lambda.logging.services.Logger",
                ["magic:caching:service"] = "magic.lambda.caching.services.MagicMemoryCache",
            }));
            Assert.IsType<magic.node.services.FileService>(provider.GetService<IFileService>());
        }

        [Fact]
        public void UnknownServiceTypeInConfigurationIsReportedWithItsName()
        {
            var ex = Assert.Throws<ArgumentException>(() => Build(Configuration(new()
            {
                ["magic:logging:service"] = "does.not.Exist",
            })));
            Assert.Contains("does.not.Exist", ex.Message);
        }

        [Fact]
        public void SocketsAreOnlyWiredWhenConfigured()
        {
            using (var without = Build(Configuration()))
                Assert.Null(without.GetService<IUserIdProvider>());
            using (var with = Build(Configuration(new() { ["magic:sockets:url"] = "/sockets" })))
                Assert.NotNull(with.GetService<IUserIdProvider>());
        }

        [Theory]
        [InlineData("utc", "utc")]
        [InlineData("local", "local")]
        [InlineData(null, "none")]
        public void DefaultTimeZoneFollowsConfiguration(string configured, string expected)
        {
            var extra = configured == null ? new() : new Dictionary<string, string> { ["magic:culture:defaultTimeZone"] = configured };
            using var provider = Build(Configuration(extra));
            Assert.Equal(expected, magic.node.extensions.Converter.DefaultTimeZone);
            magic.node.extensions.Converter.DefaultTimeZone = "none";
        }

        #endregion

        #region [ -- Middleware -- ]

        static async Task<HttpContext> RunAsync(ApplicationBuilder app, Action<HttpContext> prepare = null)
        {
            var context = new DefaultHttpContext();
            context.Response.Body = new MemoryStream();
            prepare?.Invoke(context);
            await app.Build()(context);
            return context;
        }

        static ApplicationBuilder Pipeline(IServiceProvider provider) => new ApplicationBuilder(provider);

        [Fact]
        public async Task ForwardedHeadersAreUsedByDefault()
        {
            using var provider = Build(Configuration());
            var app = Pipeline(provider);
            app.UseMagicForwardedHeaders(Configuration());
            var context = await RunAsync(app, c =>
            {
                c.Connection.RemoteIpAddress = IPAddress.Parse("10.0.0.1");
                c.Request.Headers["X-Forwarded-For"] = "203.0.113.7";
                c.Request.Headers["X-Forwarded-Proto"] = "https";
            });
            Assert.Equal(IPAddress.Parse("203.0.113.7"), context.Connection.RemoteIpAddress);
            Assert.Equal("https", context.Request.Scheme);
        }

        [Fact]
        public async Task ForwardedHeadersCanBeTurnedOff()
        {
            var configuration = Configuration(new() { ["magic:forwarded-headers:enabled"] = "false" });
            using var provider = Build(configuration);
            var app = Pipeline(provider);
            app.UseMagicForwardedHeaders(configuration);
            var context = await RunAsync(app, c =>
            {
                c.Connection.RemoteIpAddress = IPAddress.Parse("10.0.0.1");
                c.Request.Headers["X-Forwarded-For"] = "203.0.113.7";
            });
            Assert.Equal(IPAddress.Parse("10.0.0.1"), context.Connection.RemoteIpAddress);
        }

        [Fact]
        public async Task ForwardedHeadersHonourTheForwardLimit()
        {
            var configuration = Configuration(new() { ["magic:forwarded-headers:forward-limit"] = "2" });
            using var provider = Build(configuration);
            var app = Pipeline(provider);
            app.UseMagicForwardedHeaders(configuration);
            var context = await RunAsync(app, c =>
            {
                c.Connection.RemoteIpAddress = IPAddress.Parse("10.0.0.1");
                c.Request.Headers["X-Forwarded-For"] = "198.51.100.1, 203.0.113.7";
            });
            Assert.Equal(IPAddress.Parse("198.51.100.1"), context.Connection.RemoteIpAddress);
        }

        [Fact]
        public async Task CorsMiddlewareIsAdded()
        {
            using var provider = Build(Configuration());
            var app = Pipeline(provider);
            app.UseMagicCors(Configuration());
            var context = await RunAsync(app, c => c.Request.Method = "GET");

            // Nothing follows the middleware, so the request falls out of the end of the pipeline.
            Assert.Equal(404, context.Response.StatusCode);
        }

        #endregion

        #region [ -- CORS policy -- ]

        static async Task<CorsPolicy> CorsPolicyFor(IConfiguration configuration, string origin, string host = "api.example.com")
        {
            using var provider = Build(configuration);
            var context = new DefaultHttpContext();
            context.Request.Host = new HostString(host);
            if (origin != null)
                context.Request.Headers.Origin = origin;
            return await provider.GetRequiredService<ICorsPolicyProvider>().GetPolicyAsync(context, null);
        }

        [Fact]
        public async Task AnyOriginIsAllowedWhenNoFrontendIsConfigured()
        {
            var policy = await CorsPolicyFor(Configuration(), "https://anywhere.example.org");
            Assert.True(policy.IsOriginAllowed("https://anywhere.example.org"));
            Assert.True(policy.IsOriginAllowed(""));
            Assert.True(policy.AllowAnyHeader);
            Assert.True(policy.AllowAnyMethod);
        }

        [Fact]
        public async Task OnlyConfiguredFrontendsAreAllowed()
        {
            var policy = await CorsPolicyFor(
                Configuration(new() { ["magic:frontend:urls"] = "https://app.one.org, https://app.two.org" }),
                "https://app.one.org");
            Assert.True(policy.IsOriginAllowed("https://app.one.org"));
            Assert.True(policy.IsOriginAllowed("https://APP.TWO.org"));
            Assert.False(policy.IsOriginAllowed("https://evil.example.org"));
            Assert.True(policy.IsOriginAllowed(""));
        }

        [Fact]
        public async Task BlankFrontendConfigurationAllowsAnyOrigin()
        {
            var policy = await CorsPolicyFor(Configuration(new() { ["magic:frontend:urls"] = "  " }), "https://anywhere.example.org");
            Assert.True(policy.IsOriginAllowed("https://anywhere.example.org"));
        }

        [Fact]
        public async Task CredentialsAreSupportedForConfiguredFrontends()
        {
            var policy = await CorsPolicyFor(
                Configuration(new() { ["magic:frontend:urls"] = "https://app.one.org" }),
                "https://APP.one.org");
            Assert.True(policy.SupportsCredentials);
        }

        [Fact]
        public async Task CredentialsAreNotSupportedForUnconfiguredCrossSiteOrigins()
        {
            var policy = await CorsPolicyFor(Configuration(), "https://evil.example.org");
            Assert.False(policy.SupportsCredentials);
        }

        [Theory]
        [InlineData("https://api.example.com", "api.example.com", true)]
        [InlineData("https://app.example.com", "example.com", true)]
        [InlineData("https://example.com", "api.example.com", true)]
        [InlineData("https://API.example.com", "api.example.com", true)]
        [InlineData("https://app.example.com", "api.example.com", false)]
        [InlineData("https://notexample.com", "example.com", false)]
        [InlineData("null", "api.example.com", false)]
        [InlineData("", "api.example.com", false)]
        [InlineData(null, "api.example.com", false)]
        public async Task CredentialsAreSupportedOnlyForOriginsOnTheSameSite(string origin, string host, bool expected)
        {
            var policy = await CorsPolicyFor(Configuration(), origin, host);
            Assert.Equal(expected, policy.SupportsCredentials);
        }

        #endregion

        #region [ -- Exceptions -- ]

        static ApplicationBuilder ThrowingPipeline(IServiceProvider provider, Exception error)
        {
            var app = Pipeline(provider);
            app.UseMagicExceptions();
            app.Run(_ => throw error);
            return app;
        }

        static async Task<(int Status, string Body)> ThrowAsync(IServiceProvider provider, Exception error, string path)
        {
            var context = await RunAsync(ThrowingPipeline(provider, error), c => c.Request.Path = path);
            context.Response.Body.Position = 0;
            return (context.Response.StatusCode, new StreamReader(context.Response.Body).ReadToEnd());
        }

        [Fact]
        public async Task UnhandledExceptionReturnsAGenericMessage()
        {
            using var provider = Build(Configuration());
            var (status, body) = await ThrowAsync(provider, new InvalidOperationException("secret detail"), "/magic/modules/foo/bar");
            Assert.Equal(500, status);
            Assert.Contains("Guru meditation", body);
            Assert.DoesNotContain("secret detail", body);
        }

        [Fact]
        public async Task PublicHyperlambdaExceptionExposesItsMessageAndStatus()
        {
            using var provider = Build(Configuration());
            var (status, body) = await ThrowAsync(
                provider,
                new magic.node.extensions.HyperlambdaException("Name is required", true, 400, "name"),
                "/magic/modules/foo/bar");
            Assert.Equal(400, status);
            Assert.Contains("Name is required", body);
            Assert.Contains("name", body);
        }

        [Fact]
        public async Task PrivateHyperlambdaExceptionKeepsItsStatusButHidesItsMessage()
        {
            using var provider = Build(Configuration());
            var (status, body) = await ThrowAsync(
                provider,
                new magic.node.extensions.HyperlambdaException("internal detail", false, 403),
                "/magic/modules/foo/bar");
            Assert.Equal(403, status);
            Assert.DoesNotContain("internal detail", body);
        }

        [Fact]
        public async Task CustomExceptionHandlerFileIsUsed()
        {
            Directory.CreateDirectory(_folder + "/modules/foo");
            File.WriteAllText(_folder + "/modules/foo/exceptions.hl", "return\n   status:int:418\n   message:The custom message\n");
            using var provider = Build(Configuration());
            var (status, body) = await ThrowAsync(provider, new InvalidOperationException("x"), "/magic/modules/foo/bar");
            Assert.Equal(418, status);
            Assert.Contains("The custom message", body);
        }

        [Fact]
        public async Task CustomExceptionHandlerIsFoundInAParentFolder()
        {
            Directory.CreateDirectory(_folder + "/modules/foo/deeper");
            File.WriteAllText(_folder + "/modules/foo/exceptions.hl", "return\n   message:From the parent\n");
            using var provider = Build(Configuration());
            var (status, body) = await ThrowAsync(provider, new InvalidOperationException("x"), "/magic/modules/foo/deeper/bar");
            Assert.Equal(500, status);
            Assert.Contains("From the parent", body);
        }

        [Fact]
        public async Task BrokenCustomExceptionHandlerFallsBackToTheDefault()
        {
            Directory.CreateDirectory(_folder + "/modules/foo");
            File.WriteAllText(_folder + "/modules/foo/exceptions.hl", "throw:The handler itself fails\n");
            using var provider = Build(Configuration());
            var (status, body) = await ThrowAsync(provider, new InvalidOperationException("x"), "/magic/modules/foo/bar");
            Assert.Equal(500, status);
            Assert.Contains("Guru meditation", body);
        }

        #endregion

        #region [ -- Start-up -- ]

        [Fact]
        public async Task StartupFileIsExecuted()
        {
            Directory.CreateDirectory(_folder + "/system");
            File.WriteAllText(_folder + "/system/startup.hl", "io.file.save:/ran.txt\n   .:it ran\n");
            using var provider = Build(Configuration());
            await Pipeline(provider).UseMagicStartupFiles();
            Assert.True(File.Exists(_folder + "/ran.txt"));
        }

        [Fact]
        public async Task MissingStartupFileIsFine()
        {
            using var provider = Build(Configuration());
            var error = await Record.ExceptionAsync(() => Pipeline(provider).UseMagicStartupFiles());
            Assert.Null(error);
            Assert.False(File.Exists(_folder + "/ran.txt"));
        }

        [Theory]
        [InlineData("a-secret-that-is-longer-than-fifty-characters-so-the-scheduler-starts", 1)]
        [InlineData("too-short", 0)]
        public async Task SchedulerStartsOnlyWithAProperSecret(string secret, int starts)
        {
            var scheduler = new Mock<ITaskScheduler>();
            var configuration = Configuration(new() { ["magic:auth:secret"] = secret });
            var replaced = new ServiceCollection();
            replaced.AddSingleton(scheduler.Object);
            using var appProvider = replaced.BuildServiceProvider();
            await Pipeline(appProvider).UseMagicSchedulerAsync(configuration);
            scheduler.Verify(x => x.StartAsync(), Times.Exactly(starts));
        }

        #endregion
    }
}
