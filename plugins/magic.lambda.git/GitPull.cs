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
    /// [git.pull] slot to pull updates from a remote.
    /// </summary>
    [Slot(
        Name = "git.pull",
        Description = "Pulls updates from a Git remote",
        ValueKind = "git-repo-path",
        ValueDescription = "Repository path",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "git-response,text",
        ReturnsDescription = "Resolves to the git pull command output",
        SignatureType = typeof(global::magic.lambda.git.signatures.GitPullSignature))]
    public class GitPull : ISlotAsync
    {
        readonly IRootResolver _rootResolver;
        readonly IConfiguration _configuration;

        public GitPull(IRootResolver rootResolver, IConfiguration configuration)
        {
            _rootResolver = rootResolver;
            _configuration = configuration;
        }

        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            var args = GetArgs(input);

            var gitArgs = GitSlotHelpers.Args("pull");
            if (args.Rebase)
                gitArgs.Add("--rebase");
            if (args.FfOnly)
                gitArgs.Add("--ff-only");

            if (!string.IsNullOrWhiteSpace(args.Remote))
                gitArgs.Add(args.Remote);
            if (!string.IsNullOrWhiteSpace(args.Branch))
                gitArgs.Add(args.Branch);

            var repoPath = GitSlotHelpers.ResolveRepoPath(_rootResolver, args.Path);
            input.Value = await GitSlotHelpers.RunGitAsync(
                repoPath,
                gitArgs,
                GitSlotHelpers.GetGitHubAuthArgs(_configuration));
        }

        #region [ -- Private helper methods -- ]

        (string Path, string Remote, string Branch, bool Rebase, bool FfOnly) GetArgs(Node input)
        {
            var path = GitSlotHelpers.GetRequiredPrimaryValue(input);
            var remote = input.Children.FirstOrDefault(x => x.Name == "remote")?.GetEx<string>() ?? "origin";
            var branch = input.Children.FirstOrDefault(x => x.Name == "branch")?.GetEx<string>();
            var rebase = input.Children.FirstOrDefault(x => x.Name == "rebase")?.GetEx<bool>() ?? false;
            var ffOnly = input.Children.FirstOrDefault(x => x.Name == "ff-only")?.GetEx<bool>() ?? false;

            input.Clear();
            input.Value = null;

            return (path, remote, branch, rebase, ffOnly);
        }

        #endregion
    }
}
