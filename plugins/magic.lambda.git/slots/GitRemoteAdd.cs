/*
 * Copyright (c) Thomas Hansen, 2021 - 2023 thomas@ainiro.io.
 */

using System.Linq;
using System.Threading.Tasks;
using magic.node;
using magic.node.contracts;
using magic.node.extensions;
using magic.signals.contracts;
using Microsoft.Extensions.Configuration;

namespace magic.lambda.git
{
    /// <summary>
    /// [git.remote.add] slot to add a git remote.
    /// </summary>
    [Slot(
        Name = "git.remote.add",
        Description = "Adds a Git remote",
        ValueKind = "git-repo-path",
        ValueDescription = "Repository path",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "git-response,text",
        ReturnsDescription = "Resolves to the git remote add command output",
        SignatureType = typeof(global::magic.lambda.git.signatures.GitRemoteAddSignature))]
    public class GitRemoteAdd : ISlotAsync
    {
        readonly IRootResolver _rootResolver;
        readonly IConfiguration _configuration;

        public GitRemoteAdd(IRootResolver rootResolver, IConfiguration configuration)
        {
            _rootResolver = rootResolver;
            _configuration = configuration;
        }

        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            var args = GetArgs(input);

            var gitArgs = GitSlotHelpers.Args("remote", "add", args.Name, args.Url);
            var repoPath = GitSlotHelpers.ResolveRepoPath(_rootResolver, args.Path);

            input.Value = await GitSlotHelpers.RunGitAsync(
                repoPath,
                gitArgs,
                GitSlotHelpers.GetGitHubAuthArgs(_configuration));
        }

        #region [ -- Private helper methods -- ]

        (string Path, string Name, string Url) GetArgs(Node input)
        {
            var path = GitSlotHelpers.GetRequiredPrimaryValue(input);
            var name = input.Children.FirstOrDefault(x => x.Name == "name")?.GetEx<string>() ?? "origin";
            var url = input.Children.FirstOrDefault(x => x.Name == "url")?.GetEx<string>();
            if (string.IsNullOrWhiteSpace(url))
                throw new HyperlambdaException("Missing required argument 'url'");

            input.Clear();
            input.Value = null;

            return (path, name, url);
        }

        #endregion
    }
}
