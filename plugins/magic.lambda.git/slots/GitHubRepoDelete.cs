/*
 * Copyright (c) Thomas Hansen, 2021 - 2023 thomas@ainiro.io.
 */

using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.git
{
    /// <summary>
    /// [github.repo.delete] slot to delete a GitHub repository.
    /// </summary>
    [Slot(
        Name = "github.repo.delete",
        Description = "Deletes a GitHub repository",
        ValueKind = "github-repo-name",
        ValueDescription = "GitHub repository name",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "boolean",
        ReturnsDescription = "Returns true after the repository has been deleted",
        SignatureType = typeof(global::magic.lambda.git.signatures.GitHubRepoDeleteSignature))]
    public class GitHubRepoDelete : ISlotAsync
    {
        readonly HttpClient _httpClient;
        readonly IConfiguration _configuration;

        public GitHubRepoDelete(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _configuration = configuration;
        }

        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            var args = GetArgs(input);
            var owner = string.IsNullOrWhiteSpace(args.Owner)
                ? GitHubApi.GetDefaultOwner(_configuration)
                : args.Owner;

            await GitHubApi.SendAsync(
                _httpClient,
                _configuration,
                HttpMethod.Delete,
                $"repos/{owner}/{args.Name}");

            input.Clear();
            input.Value = true;
        }

        #region [ -- Private helper methods -- ]

        static (string Name, string Owner) GetArgs(Node input)
        {
            var name = input.GetEx<string>();
            if (string.IsNullOrWhiteSpace(name))
                throw new HyperlambdaException("Missing required argument value");

            var owner = input.Children.FirstOrDefault(x => x.Name == "owner")?.GetEx<string>();

            input.Clear();
            input.Value = null;

            return (name, owner);
        }

        #endregion
    }
}
