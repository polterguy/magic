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
    /// [git.create-repo] slot to initialise a folder as a Git repo.
    /// </summary>
    [Slot(
        Name = "git.create-repo",
        Description = "Initializes a Git repository",
        ValueKind = "folder-path",
        ValueDescription = "Folder path to initialize as a repository",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "git-response,text",
        ReturnsDescription = "Resolves to the git init command output",
        SignatureType = typeof(global::magic.lambda.git.signatures.GitCreateRepoSignature))]
    public class GitCreateRepo : ISlotAsync
    {
        readonly IRootResolver _rootResolver;
        readonly IConfiguration _configuration;

        public GitCreateRepo(IRootResolver rootResolver, IConfiguration configuration)
        {
            _rootResolver = rootResolver;
            _configuration = configuration;
        }

        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            var args = GetArgs(input);

            var gitArgs = GitSlotHelpers.Args("init");

            if (!string.IsNullOrWhiteSpace(args.Branch))
            {
                gitArgs.Add("-b");
                gitArgs.Add(args.Branch);
            }

            if (args.Bare)
                gitArgs.Add("--bare");

            gitArgs.Add(GitSlotHelpers.ResolveRepoPath(_rootResolver, args.Path));

            input.Value = await GitSlotHelpers.RunGitAsync(
                _rootResolver.DynamicFiles,
                gitArgs,
                GitSlotHelpers.GetGitHubAuthArgs(_configuration));
        }

        #region [ -- Private helper methods -- ]

        (string Path, string Branch, bool Bare) GetArgs(Node input)
        {
            var path = GitSlotHelpers.GetRequiredPrimaryValue(input);
            var branch = GitSlotHelpers.GetOptionalChild(input, "branch");
            var bare = GitSlotHelpers.GetOptionalBool(input, "bare", false);

            input.Clear();
            input.Value = null;

            return (path, branch, bare);
        }

        #endregion
    }
}
