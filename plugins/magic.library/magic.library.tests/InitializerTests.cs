/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
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
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Http;
using System.Net.Http;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using Moq;
using Xunit;
using magic.node;
using magic.node.contracts;
using magic.node.extensions;
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

        [Fact]
        public void AuthSettingsReadTheConfiguration()
        {
            using var provider = Build(Configuration(new()
            {
                ["magic:auth:secret"] = "s3cret",
                ["magic:auth:https-only"] = "True",
                ["magic:auth:valid-minutes"] = "45",
                ["magic:auth:authentication"] = "auth.slot",
                ["magic:auth:ldap"] = "ldap.slot",
                ["magic:auth:auto-auth"] = "auto.slot",
                ["magic:auth:registration:allow"] = "True",
                ["magic:auth:registration:confirm-email"] = "confirm@example.com",
            }));
            var settings = provider.GetService<IAuthSettings>();
            Assert.Equal("s3cret", settings.Secret);
            Assert.True(settings.HttpsOnly);
            Assert.Equal(45, settings.ValidMinutes);
            Assert.Equal("auth.slot", settings.AuthenticationSlot);
            Assert.Equal("ldap.slot", settings.LDAP);
            Assert.Equal("auto.slot", settings.AutoAuthSlot);
            Assert.True(settings.AllowRegistration);
            Assert.Equal("confirm@example.com", settings.ConfirmEmailAddress);
        }

        [Fact]
        public void AuthSettingsHaveSafeDefaults()
        {
            using var provider = Build(Configuration(new() { ["magic:auth:secret"] = null }));
            var settings = provider.GetService<IAuthSettings>();
            Assert.Equal("", settings.Secret);
            Assert.False(settings.HttpsOnly);
            Assert.Equal(20, settings.ValidMinutes);
            Assert.False(settings.AllowRegistration);
            Assert.Null(settings.ConfirmEmailAddress);
        }

        [Theory]
        [InlineData("/../etc/passwd")]
        [InlineData("/foo/../../bar")]
        [InlineData("..\\bar")]
        public void RootResolverRejectsPathTraversal(string path)
        {
            using var provider = Build(Configuration());
            var resolver = provider.GetService<IRootResolver>();
            Assert.Throws<HyperlambdaException>(() => resolver.AbsolutePath(path));
        }

        [Fact]
        public void RootResolverRejectsRelativePathOutsideTheRoot()
        {
            using var provider = Build(Configuration());
            var resolver = provider.GetService<IRootResolver>();
            Assert.Throws<HyperlambdaException>(() => resolver.RelativePath("/somewhere/else/file.txt"));
        }

        [Fact]
        public void RootResolverRuntimePathIsRelativeToTheParentOfTheDynamicFolder()
        {
            using var provider = Build(Configuration());
            var resolver = provider.GetService<IRootResolver>();
            var parent = _folder.Replace("\\", "/");
            parent = string.Concat(parent.AsSpan(0, parent.LastIndexOf('/')), "/");
            Assert.Equal(parent + "foo/bar.txt", resolver.RuntimePath("/foo\\bar.txt"));
        }

        [Fact]
        public void EveryWhitelistComparerIsUsable()
        {
            using var provider = Build(Configuration(new() { ["magic:sockets:url"] = "/sockets" }));
            using var scope = provider.CreateScope();
            var comparers = AppDomain.CurrentDomain.GetAssemblies()
                .Where(x => !x.IsDynamic && !x.FullName.StartsWith("Microsoft", StringComparison.Ordinal) && !x.FullName.StartsWith("System", StringComparison.Ordinal))
                .SelectMany(x => x.GetTypes())
                .Where(x => typeof(IWhitelistComparer).IsAssignableFrom(x) && !x.IsInterface && !x.IsAbstract)
                .ToList();
            Assert.True(comparers.Count >= 20, "Expected the slots with a whitelist comparer, found " + comparers.Count);
            foreach (var type in comparers)
            {
                var comparer = Assert.IsType<IWhitelistComparer>(scope.ServiceProvider.GetService(type), exactMatch: false).Comparer;
                Assert.NotNull(comparer);
                Assert.True(comparer("/foo/bar", "/foo/bar"), type.Name + " does not match identical values");
                Assert.False(comparer("/foo/bar", "/other/place"), type.Name + " matches different values");
            }
        }

        #region [ -- Certificate validation of the HTTP client -- ]

        static SocketsHttpHandler PrimaryHandler(ServiceProvider provider)
        {
            var handler = provider.GetRequiredService<IHttpMessageHandlerFactory>().CreateHandler();
            while (handler is DelegatingHandler delegating)
            {
                handler = delegating.InnerHandler;
            }
            return Assert.IsType<SocketsHttpHandler>(handler);
        }

        static X509Certificate2 SelfSigned()
        {
            using var key = RSA.Create(2048);
            var request = new CertificateRequest("CN=magic-test", key, HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);
            return request.CreateSelfSigned(DateTimeOffset.UtcNow.AddDays(-1), DateTimeOffset.UtcNow.AddDays(1));
        }

        static bool Validate(ServiceProvider provider, X509Certificate2 cert, System.Net.Security.SslPolicyErrors errors)
        {
            return PrimaryHandler(provider).SslOptions.RemoteCertificateValidationCallback(null, cert, null, errors);
        }

        [Fact]
        public void ValidCertificatesAreAlwaysAccepted()
        {
            using var provider = Build(Configuration());
            using var cert = SelfSigned();
            Assert.True(Validate(provider, cert, System.Net.Security.SslPolicyErrors.None));
        }

        [Fact]
        public void UntrustedCertificatesAreRejectedByDefault()
        {
            using var provider = Build(Configuration());
            using var cert = SelfSigned();
            Assert.False(Validate(provider, cert, System.Net.Security.SslPolicyErrors.RemoteCertificateChainErrors));
            Assert.False(Validate(provider, null, System.Net.Security.SslPolicyErrors.RemoteCertificateChainErrors));
        }

        [Fact]
        public void WildcardTrustAcceptsEverything()
        {
            using var provider = Build(Configuration(new() { ["magic:trusted-certs"] = "*" }));
            using var cert = SelfSigned();
            Assert.True(Validate(provider, cert, System.Net.Security.SslPolicyErrors.RemoteCertificateChainErrors));
        }

        [Fact]
        public void CertificatesCanBeTrustedByTheirHash()
        {
            using var cert = SelfSigned();
            using var other = SelfSigned();
            using var provider = Build(Configuration(new() { ["magic:trusted-certs"] = "ABCDEF, " + cert.GetCertHashString() }));
            Assert.True(Validate(provider, cert, System.Net.Security.SslPolicyErrors.RemoteCertificateChainErrors));
            Assert.False(Validate(provider, other, System.Net.Security.SslPolicyErrors.RemoteCertificateChainErrors));
        }

        #endregion

        #region [ -- Choosing the executor and reading JWT tokens -- ]

        [Theory]
        [InlineData("/magic/modules/foo/bar", "HttpApiExecutorAsync")]
        [InlineData("/index.html", "HttpFileExecutorAsync")]
        [InlineData("/", "HttpFileExecutorAsync")]
        public void ExecutorDependsOnWhetherTheUrlIsUnderMagic(string path, string expected)
        {
            using var provider = Build(Configuration());
            using var scope = provider.CreateScope();
            var accessor = provider.GetRequiredService<IHttpContextAccessor>();
            accessor.HttpContext = new DefaultHttpContext();
            accessor.HttpContext.Request.Path = path;
            Assert.Equal(expected, scope.ServiceProvider.GetRequiredService<IHttpExecutorAsync>().GetType().Name);
        }

        static async Task<string> Token(ServiceProvider provider, Action<HttpContext> setup)
        {
            var options = provider.GetRequiredService<IOptionsMonitor<JwtBearerOptions>>().Get(JwtBearerDefaults.AuthenticationScheme);
            var http = new DefaultHttpContext();
            http.Request.Host = new HostString("example.com");
            setup(http);
            var context = new MessageReceivedContext(http, new AuthenticationScheme(JwtBearerDefaults.AuthenticationScheme, null, typeof(JwtBearerHandler)), options);
            await options.Events.OnMessageReceived(context);
            return context.Token;
        }

        [Fact]
        public async Task TicketCookieIsUsedWithoutAnOrigin()
        {
            using var provider = Build(Configuration());
            Assert.Equal("abc", await Token(provider, http => http.Request.Headers.Cookie = "ticket=abc"));
        }

        [Fact]
        public async Task TicketCookieIsUsedFromTheSameSiteOnly()
        {
            using var provider = Build(Configuration());
            Assert.Equal("abc", await Token(provider, http =>
            {
                http.Request.Headers.Cookie = "ticket=abc";
                http.Request.Headers.Origin = "https://example.com";
            }));
            Assert.Null(await Token(provider, http =>
            {
                http.Request.Headers.Cookie = "ticket=abc";
                http.Request.Headers.Origin = "https://evil.test";
            }));
        }

        [Fact]
        public async Task SocketsMayAuthenticateWithAQueryParameterButNothingElseMay()
        {
            using var provider = Build(Configuration());
            Assert.Equal("from-query", await Token(provider, http =>
            {
                http.Request.Path = "/sockets";
                http.Request.QueryString = new QueryString("?access_token=from-query");
            }));
            Assert.Null(await Token(provider, http =>
            {
                http.Request.Path = "/magic/modules/foo";
                http.Request.QueryString = new QueryString("?access_token=from-query");
            }));
        }

        [Fact]
        public void JwtOptionsFollowTheConfiguration()
        {
            using var provider = Build(Configuration(new() { ["magic:auth:https-only"] = "TRUE" }));
            var options = provider.GetRequiredService<IOptionsMonitor<JwtBearerOptions>>().Get(JwtBearerDefaults.AuthenticationScheme);
            Assert.True(options.RequireHttpsMetadata);
            Assert.True(options.SaveToken);
            var key = Assert.Single(options.TokenValidationParameters.IssuerSigningKeyResolver(null, null, null, null));
            Assert.IsType<Microsoft.IdentityModel.Tokens.SymmetricSecurityKey>(key);

            using var relaxed = Build(Configuration());
            Assert.False(relaxed.GetRequiredService<IOptionsMonitor<JwtBearerOptions>>().Get(JwtBearerDefaults.AuthenticationScheme).RequireHttpsMetadata);
        }

        #endregion
    }
}
