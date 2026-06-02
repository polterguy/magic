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
    /// [git.fetch] slot to fetch updates from a remote.
    /// </summary>
    [Slot(
        Name = "git.fetch",
        Description = "Fetches updates from a Git remote",
        ValueKind = "git-repo-path",
        ValueDescription = "Repository path",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "git-response,text",
        ReturnsDescription = "Resolves to the git fetch command output",
        SignatureType = typeof(global::magic.lambda.git.signatures.GitFetchSignature))]
    public class GitFetch : ISlotAsync
    {
        readonly IRootResolver _rootResolver;
        readonly IConfiguration _configuration;

        public GitFetch(IRootResolver rootResolver, IConfiguration configuration)
        {
            _rootResolver = rootResolver;
            _configuration = configuration;
        }

        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            var args = GetArgs(input);

            var gitArgs = GitSlotHelpers.Args("fetch");
            if (!string.IsNullOrWhiteSpace(args.Remote))
                gitArgs.Add(args.Remote);
            if (!string.IsNullOrWhiteSpace(args.Refspec))
                gitArgs.Add(args.Refspec);

            var repoPath = GitSlotHelpers.ResolveRepoPath(_rootResolver, args.Path);
            input.Value = await GitSlotHelpers.RunGitAsync(
                repoPath,
                gitArgs,
                GitSlotHelpers.GetGitHubAuthArgs(_configuration));
        }

        #region [ -- Private helper methods -- ]

        (string Path, string Remote, string Refspec) GetArgs(Node input)
        {
            var path = GitSlotHelpers.GetRequiredPrimaryValue(input);
            var remote = input.Children.FirstOrDefault(x => x.Name == "remote")?.GetEx<string>() ?? "origin";
            var refspec = input.Children.FirstOrDefault(x => x.Name == "refspec")?.GetEx<string>();

            input.Clear();
            input.Value = null;

            return (path, remote, refspec);
        }

        #endregion
    }
}
