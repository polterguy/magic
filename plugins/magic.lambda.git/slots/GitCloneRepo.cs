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
    /// [git.clone-repo] slot to clone a repo.
    /// </summary>
    [Slot(
        Name = "git.clone-repo",
        Description = "Clones a Git repository",
        ValueKind = "git-url",
        ValueDescription = "Repository URL to clone",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "git-response,text",
        ReturnsDescription = "Resolves to the git clone command output",
        SignatureType = typeof(global::magic.lambda.git.signatures.GitCloneRepoSignature))]
    public class GitCloneRepo : ISlotAsync
    {
        readonly IRootResolver _rootResolver;
        readonly IConfiguration _configuration;

        public GitCloneRepo(IRootResolver rootResolver, IConfiguration configuration)
        {
            _rootResolver = rootResolver;
            _configuration = configuration;
        }

        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            var args = GetArgs(input);

            var gitArgs = GitSlotHelpers.Args("clone", args.Url);

            if (!string.IsNullOrWhiteSpace(args.Branch))
            {
                gitArgs.Add("-b");
                gitArgs.Add(args.Branch);
            }

            if (!string.IsNullOrWhiteSpace(args.Depth))
            {
                gitArgs.Add("--depth");
                gitArgs.Add(args.Depth);
            }

            if (!string.IsNullOrWhiteSpace(args.Destination))
                gitArgs.Add(GitSlotHelpers.ResolveRepoPath(_rootResolver, args.Destination));

            var workingDirectory = _rootResolver.DynamicFiles;
            input.Value = await GitSlotHelpers.RunGitAsync(
                workingDirectory,
                gitArgs,
                GitSlotHelpers.GetGitHubAuthArgs(_configuration));
        }

        #region [ -- Private helper methods -- ]

        (string Url, string Destination, string Branch, string Depth) GetArgs(Node input)
        {
            var url = GitSlotHelpers.GetRequiredPrimaryValue(input);
            var destination = GitSlotHelpers.GetOptionalChild(input, "path");
            var branch = GitSlotHelpers.GetOptionalChild(input, "branch");
            var depth = GitSlotHelpers.GetOptionalChild(input, "depth");

            input.Clear();
            input.Value = null;

            return (url, destination, branch, depth);
        }

        #endregion
    }
}
