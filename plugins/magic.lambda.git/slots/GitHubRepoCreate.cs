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
    /// [github.repo.create] slot to create a GitHub repository.
    /// </summary>
    [Slot(
        Name = "github.repo.create",
        Description = "Creates a GitHub repository",
        ValueKind = "github-repo-name",
        ValueDescription = "GitHub repository name",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.Lambda,
        ReturnsKind = "github-repository,lambda-tree",
        ReturnsDescription = "Resolves to the created GitHub repository as child nodes projected from the API response",
        SignatureType = typeof(global::magic.lambda.git.signatures.GitHubRepoCreateSignature))]
    public class GitHubRepoCreate : ISlotAsync
    {
        readonly HttpClient _httpClient;
        readonly IConfiguration _configuration;

        public GitHubRepoCreate(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _configuration = configuration;
        }

        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            var args = GetArgs(input);
            var payload = BuildPayload(args);
            var json = JsonSerializer.Serialize(payload);

            var endpoint = string.IsNullOrWhiteSpace(args.Owner)
                ? "user/repos"
                : $"orgs/{args.Owner}/repos";

            var response = await GitHubApi.SendAsync(_httpClient, _configuration, HttpMethod.Post, endpoint, json);

            input.Clear();
            input.Value = null;
            var tmp = new Node("", response);
            signaler.Signal("json2lambda", tmp, skipWhitelist: true);
            foreach (var child in tmp.Children.ToList())
                input.Add(child);
        }

        #region [ -- Private helper methods -- ]

        (string Name, string Owner, bool Private, string Description, string Homepage, bool AutoInit, string DefaultBranch, string Gitignore, string License) GetArgs(Node input)
        {
            var name = input.GetEx<string>();
            if (string.IsNullOrWhiteSpace(name))
                throw new HyperlambdaException("Missing required argument value");

            var owner = input.Children.FirstOrDefault(x => x.Name == "owner")?.GetEx<string>();
            var isPrivate = input.Children.FirstOrDefault(x => x.Name == "private")?.GetEx<bool>() ?? false;
            var description = input.Children.FirstOrDefault(x => x.Name == "description")?.GetEx<string>();
            var homepage = input.Children.FirstOrDefault(x => x.Name == "homepage")?.GetEx<string>();
            var autoInit = input.Children.FirstOrDefault(x => x.Name == "auto-init")?.GetEx<bool>() ?? false;
            var defaultBranch = input.Children.FirstOrDefault(x => x.Name == "default-branch")?.GetEx<string>();
            var gitignore = input.Children.FirstOrDefault(x => x.Name == "gitignore-template")?.GetEx<string>();
            var license = input.Children.FirstOrDefault(x => x.Name == "license-template")?.GetEx<string>();

            input.Clear();
            input.Value = null;

            return (name, owner, isPrivate, description, homepage, autoInit, defaultBranch, gitignore, license);
        }

        Dictionary<string, object> BuildPayload(
            (string Name, string Owner, bool Private, string Description, string Homepage, bool AutoInit, string DefaultBranch, string Gitignore, string License) args)
        {
            var payload = new Dictionary<string, object>
            {
                ["name"] = args.Name,
                ["private"] = args.Private,
            };

            if (!string.IsNullOrWhiteSpace(args.Description))
                payload["description"] = args.Description;
            if (!string.IsNullOrWhiteSpace(args.Homepage))
                payload["homepage"] = args.Homepage;
            if (args.AutoInit)
                payload["auto_init"] = true;
            if (!string.IsNullOrWhiteSpace(args.DefaultBranch))
                payload["default_branch"] = args.DefaultBranch;
            if (!string.IsNullOrWhiteSpace(args.Gitignore))
                payload["gitignore_template"] = args.Gitignore;
            if (!string.IsNullOrWhiteSpace(args.License))
                payload["license_template"] = args.License;

            return payload;
        }

        #endregion
    }
}
