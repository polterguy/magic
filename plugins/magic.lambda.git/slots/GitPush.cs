/*
 * Copyright (c) Thomas Hansen, 2021 - 2023 thomas@ainiro.io.
 */

using System.Threading.Tasks;
using magic.node;
using magic.node.contracts;
using magic.signals.contracts;
using Microsoft.Extensions.Configuration;

namespace magic.lambda.git
{
    /// <summary>
    /// [git.push] slot to push changes to a remote.
    /// </summary>
    [Slot(
        Name = "git.push",
        Description = "Pushes changes to a Git remote",
        ValueKind = "git-repo-path",
        ValueDescription = "Repository path",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "git-response,text",
        ReturnsDescription = "Resolves to the git push command output",
        SignatureType = typeof(global::magic.lambda.git.signatures.GitPushSignature))]
    public class GitPush : ISlotAsync
    {
        readonly IRootResolver _rootResolver;
        readonly IConfiguration _configuration;

        public GitPush(IRootResolver rootResolver, IConfiguration configuration)
        {
            _rootResolver = rootResolver;
            _configuration = configuration;
        }

        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            var args = GetArgs(input);

            var gitArgs = GitSlotHelpers.Args("push");
            if (args.SetUpstream)
                gitArgs.Add("-u");

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

        (string Path, string Remote, string Branch, bool SetUpstream) GetArgs(Node input)
        {
            var path = GitSlotHelpers.GetRequiredPrimaryValue(input);
            var remote = GitSlotHelpers.GetOptionalChild(input, "remote") ?? "origin";
            var branch = GitSlotHelpers.GetOptionalChild(input, "branch");
            var setUpstream = GitSlotHelpers.GetOptionalBool(input, "set-upstream", false);

            input.Clear();
            input.Value = null;

            return (path, remote, branch, setUpstream);
        }

        #endregion
    }
}
