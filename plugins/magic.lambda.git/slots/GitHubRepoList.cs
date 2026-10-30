/*
 * Copyright (c) Thomas Hansen, 2021 - 2023 thomas@ainiro.io.
 */

using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.git
{
    /// <summary>
    /// [github.repo.list] slot to list GitHub repositories.
    /// </summary>
    [Slot(
        Name = "github.repo.list",
        Description = "Lists GitHub repositories using child-node filters",
        ReturnsMode = SlotReturnsMode.Lambda,
        ReturnsKind = "github-repository-list,node-list",
        ReturnsElementKind = "github-repository,lambda-tree",
        ReturnsDescription = "Returns one child node per GitHub repository with the projected repository metadata",
        SignatureType = typeof(global::magic.lambda.git.signatures.GitHubRepoListSignature))]
    public class GitHubRepoList : ISlotAsync
    {
        readonly HttpClient _httpClient;
        readonly IConfiguration _configuration;

        public GitHubRepoList(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _configuration = configuration;
        }

        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            var args = GetArgs(input);
            var endpoint = BuildEndpoint(args);

            var response = await GitHubApi.SendAsync(_httpClient, _configuration, HttpMethod.Get, endpoint);

            input.Clear();
            input.Value = null;
            foreach (var repo in ProjectRepos(response))
                input.Add(repo);
        }

        #region [ -- Private helper methods -- ]

        (string Owner, string Visibility, string Type, int? PerPage, int? Page) GetArgs(Node input)
        {
            var owner = input.Children.FirstOrDefault(x => x.Name == "owner")?.GetEx<string>();
            var visibility = input.Children.FirstOrDefault(x => x.Name == "visibility")?.GetEx<string>();
            var type = input.Children.FirstOrDefault(x => x.Name == "type")?.GetEx<string>();
            var perPage = GetOptionalInt(input, "per-page");
            var page = GetOptionalInt(input, "page");

            input.Clear();
            input.Value = null;

            return (owner, visibility, type, perPage, page);
        }

        static int? GetOptionalInt(Node input, string name)
        {
            var node = input.Children.FirstOrDefault(x => x.Name == name);
            if (node == null || node.Value == null)
                return null;

            if (node.Value is int intValue)
                return intValue;

            if (int.TryParse(node.GetEx<string>(), out var parsed))
                return parsed;

            throw new HyperlambdaException($"Invalid integer value for [{name}]");
        }

        static string BuildEndpoint((string Owner, string Visibility, string Type, int? PerPage, int? Page) args)
        {
            var query = new List<string>();
            if (!string.IsNullOrWhiteSpace(args.Visibility))
                query.Add("visibility=" + args.Visibility);
            if (!string.IsNullOrWhiteSpace(args.Type))
                query.Add("type=" + args.Type);
            if (args.PerPage.HasValue)
                query.Add("per_page=" + args.PerPage.Value);
            if (args.Page.HasValue)
                query.Add("page=" + args.Page.Value);

            var queryString = query.Count == 0 ? "" : "?" + string.Join("&", query);

            if (string.IsNullOrWhiteSpace(args.Owner))
                return "user/repos" + queryString;

            return $"orgs/{args.Owner}/repos" + queryString;
        }

        IEnumerable<Node> ProjectRepos(string json)
        {
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.ValueKind != JsonValueKind.Array)
                throw new HyperlambdaException("GitHub API response was not an array");

            foreach (var element in doc.RootElement.EnumerateArray())
            {
                var repo = new Node(".");
                AddString(repo, "name", element);
                AddString(repo, "full_name", element);
                AddBool(repo, "private", element);
                AddString(repo, "html_url", element);
                AddString(repo, "description", element);
                AddString(repo, "default_branch", element);
                yield return repo;
            }
        }

        static void AddString(Node parent, string name, JsonElement element)
        {
            if (element.TryGetProperty(name, out var value) && value.ValueKind != JsonValueKind.Null)
                parent.Add(new Node(name, value.GetString()));
        }

        static void AddBool(Node parent, string name, JsonElement element)
        {
            if (element.TryGetProperty(name, out var value) &&
                (value.ValueKind == JsonValueKind.True || value.ValueKind == JsonValueKind.False))
            {
                parent.Add(new Node(name, value.GetBoolean()));
            }
        }

        #endregion
    }
}
