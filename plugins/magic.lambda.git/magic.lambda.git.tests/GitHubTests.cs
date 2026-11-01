/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.Extensions.Configuration;
using Xunit;
using magic.node;
using magic.node.extensions;

namespace magic.lambda.git.tests
{
    public class GitHubTests
    {
        sealed class FakeGitHub : HttpMessageHandler
        {
            readonly HttpStatusCode _status;
            readonly string _body;

            public FakeGitHub(HttpStatusCode status = HttpStatusCode.OK, string body = "{}")
            {
                _status = status;
                _body = body;
            }

            public HttpRequestMessage Request { get; private set; }

            public string RequestBody { get; private set; }

            protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            {
                Request = request;
                RequestBody = request.Content == null ? null : await request.Content.ReadAsStringAsync(cancellationToken);
                return new HttpResponseMessage(_status) { Content = new StringContent(_body), ReasonPhrase = _status.ToString() };
            }
        }

        static Dictionary<string, string> Config(bool token = true, bool username = true)
        {
            var result = new Dictionary<string, string> { ["magic:git:github:api-base"] = "https://api.example.test/" };
            if (token)
                result["magic:git:github:token"] = "tok";
            if (username)
                result["magic:git:github:username"] = "octocat";
            return result;
        }

        #region [ -- github.repo.create -- ]

        [Fact]
        public async Task CreateForTheUserSendsEveryOption()
        {
            var handler = new FakeGitHub(body: "{\"name\":\"demo\",\"html_url\":\"https://github.com/octocat/demo\"}");
            using var runtime = new Runtime(handler, Config());
            var node = await runtime.Call("github.repo.create", "demo",
                ("private", true), ("description", "a demo"), ("homepage", "https://example.test"), ("auto-init", true),
                ("default-branch", "trunk"), ("gitignore-template", "VisualStudio"), ("license-template", "mit"));

            Assert.Equal(HttpMethod.Post, handler.Request.Method);
            Assert.Equal("https://api.example.test/user/repos", handler.Request.RequestUri.ToString());
            Assert.Equal("Bearer tok", handler.Request.Headers.Authorization.ToString());
            Assert.Contains("octocat", handler.Request.Headers.UserAgent.ToString());
            Assert.Contains("application/vnd.github+json", handler.Request.Headers.Accept.ToString());
            using var body = JsonDocument.Parse(handler.RequestBody);
            var root = body.RootElement;
            Assert.Equal("demo", root.GetProperty("name").GetString());
            Assert.True(root.GetProperty("private").GetBoolean());
            Assert.Equal("a demo", root.GetProperty("description").GetString());
            Assert.Equal("https://example.test", root.GetProperty("homepage").GetString());
            Assert.True(root.GetProperty("auto_init").GetBoolean());
            Assert.Equal("trunk", root.GetProperty("default_branch").GetString());
            Assert.Equal("VisualStudio", root.GetProperty("gitignore_template").GetString());
            Assert.Equal("mit", root.GetProperty("license_template").GetString());
            Assert.Equal("demo", node.Children.First(x => x.Name == "name").Value);
            Assert.Equal("https://github.com/octocat/demo", node.Children.First(x => x.Name == "html_url").Value);
        }

        [Fact]
        public async Task CreateWithoutOptionsSendsOnlyNameAndVisibility()
        {
            var handler = new FakeGitHub();
            using var runtime = new Runtime(handler, Config());
            await runtime.Call("github.repo.create", "demo");
            using var body = JsonDocument.Parse(handler.RequestBody);
            Assert.Equal(["name", "private"], body.RootElement.EnumerateObject().Select(x => x.Name).ToArray());
            Assert.False(body.RootElement.GetProperty("private").GetBoolean());
        }

        [Fact]
        public async Task CreateForAnOrganisationUsesItsEndpoint()
        {
            var handler = new FakeGitHub();
            using var runtime = new Runtime(handler, Config());
            await runtime.Call("github.repo.create", "demo", ("owner", "acme"));
            Assert.Equal("https://api.example.test/orgs/acme/repos", handler.Request.RequestUri.ToString());
        }

        [Fact]
        public async Task CreateRequiresAName()
        {
            using var runtime = new Runtime(new FakeGitHub(), Config());
            await Assert.ThrowsAsync<HyperlambdaException>(() => runtime.Call("github.repo.create", null));
        }

        #endregion

        #region [ -- github.repo.list -- ]

        const string Repos = "[{\"name\":\"a\",\"full_name\":\"octocat/a\",\"private\":true,\"html_url\":\"https://github.com/octocat/a\",\"description\":null,\"default_branch\":\"main\",\"extra\":1}," +
            "{\"name\":\"b\",\"private\":false}]";

        [Fact]
        public async Task ListProjectsTheInterestingFields()
        {
            var handler = new FakeGitHub(body: Repos);
            using var runtime = new Runtime(handler, Config());
            var node = await runtime.Call("github.repo.list", null);
            Assert.Equal("https://api.example.test/user/repos", handler.Request.RequestUri.ToString());
            Assert.Equal(HttpMethod.Get, handler.Request.Method);
            var repos = node.Children.ToList();
            Assert.Equal(2, repos.Count);
            Assert.Equal(["name", "full_name", "private", "html_url", "default_branch"], repos[0].Children.Select(x => x.Name).ToArray());
            Assert.True((bool)repos[0].Children.First(x => x.Name == "private").Value);
            Assert.Equal(["name", "private"], repos[1].Children.Select(x => x.Name).ToArray());
        }

        [Fact]
        public async Task ListBuildsItsQueryString()
        {
            var handler = new FakeGitHub(body: "[]");
            using var runtime = new Runtime(handler, Config());
            await runtime.Call("github.repo.list", null, ("owner", "acme"), ("visibility", "private"), ("type", "all"), ("per-page", 5), ("page", "2"));
            Assert.Equal("https://api.example.test/orgs/acme/repos?visibility=private&type=all&per_page=5&page=2", handler.Request.RequestUri.ToString());
        }

        [Fact]
        public async Task ListRejectsAnInvalidPageSizeAndANonArrayResponse()
        {
            using var runtime = new Runtime(new FakeGitHub(body: "[]"), Config());
            var ex = await Assert.ThrowsAsync<HyperlambdaException>(() => runtime.Call("github.repo.list", null, ("per-page", "many")));
            Assert.Contains("[per-page]", ex.Message);
            using var other = new Runtime(new FakeGitHub(body: "{\"message\":\"nope\"}"), Config());
            var notArray = await Assert.ThrowsAsync<HyperlambdaException>(() => other.Call("github.repo.list", null));
            Assert.Contains("not an array", notArray.Message);
        }

        #endregion

        #region [ -- github.repo.delete -- ]

        [Fact]
        public async Task DeleteUsesTheConfiguredUserByDefault()
        {
            var handler = new FakeGitHub(HttpStatusCode.NoContent, "");
            using var runtime = new Runtime(handler, Config());
            var node = await runtime.Call("github.repo.delete", "demo");
            Assert.Equal(HttpMethod.Delete, handler.Request.Method);
            Assert.Equal("https://api.example.test/repos/octocat/demo", handler.Request.RequestUri.ToString());
            Assert.True((bool)node.Value);
        }

        [Fact]
        public async Task DeleteCanNameTheOwner()
        {
            var handler = new FakeGitHub(HttpStatusCode.NoContent, "");
            using var runtime = new Runtime(handler, Config(username: false));
            await runtime.Call("github.repo.delete", "demo", ("owner", "acme"));
            Assert.Equal("https://api.example.test/repos/acme/demo", handler.Request.RequestUri.ToString());
        }

        [Fact]
        public async Task DeleteWithoutOwnerOrConfiguredUserThrows()
        {
            using var runtime = new Runtime(new FakeGitHub(), Config(username: false));
            var ex = await Assert.ThrowsAsync<HyperlambdaException>(() => runtime.Call("github.repo.delete", "demo"));
            Assert.Contains("magic:git:github:username", ex.Message);
            await Assert.ThrowsAsync<HyperlambdaException>(() => runtime.Call("github.repo.delete", null));
        }

        #endregion

        #region [ -- Shared API behaviour -- ]

        [Fact]
        public async Task MissingTokenThrowsBeforeAnythingIsSent()
        {
            var handler = new FakeGitHub();
            using var runtime = new Runtime(handler, Config(token: false));
            var ex = await Assert.ThrowsAsync<HyperlambdaException>(() => runtime.Call("github.repo.list", null));
            Assert.Contains("magic:git:github:token", ex.Message);
            Assert.Null(handler.Request);
        }

        [Fact]
        public async Task FailedRequestsReportStatusAndBody()
        {
            using var runtime = new Runtime(new FakeGitHub(HttpStatusCode.UnprocessableEntity, "{\"message\":\"name already exists\"}"), Config());
            var ex = await Assert.ThrowsAsync<HyperlambdaException>(() => runtime.Call("github.repo.create", "demo"));
            Assert.Contains("422", ex.Message);
            Assert.Contains("name already exists", ex.Message);
        }

        [Fact]
        public async Task UserAgentFallsBackWithoutAUsername()
        {
            var handler = new FakeGitHub(body: "[]");
            using var runtime = new Runtime(handler, Config(username: false));
            await runtime.Call("github.repo.list", null);
            Assert.Equal("magic.lambda.git", handler.Request.Headers.UserAgent.ToString());
        }

        [Fact]
        public async Task DefaultApiBaseIsGitHub()
        {
            var handler = new FakeGitHub(body: "[]");
            using var runtime = new Runtime(handler, new() { ["magic:git:github:token"] = "tok" });
            await runtime.Call("github.repo.list", null);
            Assert.Equal("https://api.github.com/user/repos", handler.Request.RequestUri.ToString());
        }

        #endregion

        #region [ -- Helpers -- ]

        static IConfiguration Configuration(params (string Key, string Value)[] values) =>
            new ConfigurationBuilder().AddInMemoryCollection(values.ToDictionary(x => x.Key, x => x.Value)).Build();

        [Fact]
        public void AuthArgsAreEmptyWithoutBothUsernameAndToken()
        {
            Assert.Empty(GitSlotHelpers.GetGitHubAuthArgs(null));
            Assert.Empty(GitSlotHelpers.GetGitHubAuthArgs(Configuration(("magic:git:github:username", "u"))));
            Assert.Empty(GitSlotHelpers.GetGitHubAuthArgs(Configuration(("magic:git:github:token", "t"))));
        }

        [Fact]
        public void AuthArgsCarryABasicAuthHeaderForTheHost()
        {
            var args = GitSlotHelpers.GetGitHubAuthArgs(Configuration(("magic:git:github:username", "u"), ("magic:git:github:token", "t"))).ToArray();
            Assert.Equal("-c", args[0]);
            var basic = Convert.ToBase64String(Encoding.UTF8.GetBytes("u:t"));
            Assert.Equal("http.https://github.com/.extraHeader=Authorization: Basic " + basic, args[1]);
            var custom = GitSlotHelpers.GetGitHubAuthArgs(Configuration(
                ("magic:git:github:username", "u"), ("magic:git:github:token", "t"), ("magic:git:github:host", "git.example.test"))).ToArray();
            Assert.StartsWith("http.https://git.example.test/.extraHeader=", custom[1]);
        }

        [Fact]
        public void IdentityIsAddedAfterTheExtraArguments()
        {
            var args = GitSlotHelpers.WithIdentity(["-c", "x=y"], "Jane", "jane@example.test");
            Assert.Equal(["-c", "x=y", "-c", "user.name=Jane", "-c", "user.email=jane@example.test"], args.ToArray());
            Assert.Equal(["-c", "x=y"], GitSlotHelpers.WithIdentity(["-c", "x=y"], " ", null).ToArray());
        }

        [Fact]
        public void OptionLookingValuesAreRejected()
        {
            GitSlotHelpers.EnsureNotOption("main", "branch");
            Assert.Throws<HyperlambdaException>(() => GitSlotHelpers.EnsureNotOption("-x", "branch"));
        }

        [Fact]
        public void OptionalChildrenAndBooleans()
        {
            var node = new Node("x", null, [new Node("a", "1"), new Node("flag", true)]);
            Assert.Equal("1", GitSlotHelpers.GetOptionalChild(node, "a"));
            Assert.Null(GitSlotHelpers.GetOptionalChild(node, "missing"));
            Assert.True(GitSlotHelpers.GetOptionalBool(node, "flag", false));
            Assert.True(GitSlotHelpers.GetOptionalBool(node, "missing", true));
        }

        [Fact]
        public async Task GitThatCannotBeStartedIsReported()
        {
            var ex = await Assert.ThrowsAsync<HyperlambdaException>(() =>
                GitSlotHelpers.RunGitAsync("/this/folder/does/not/exist", GitSlotHelpers.Args("status")));
            Assert.Contains("Failed to start git", ex.Message);
        }

        #endregion
    }
}
