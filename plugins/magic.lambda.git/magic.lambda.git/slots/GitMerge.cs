/*
 * Copyright (c) Thomas Hansen, 2021 - 2023 thomas@ainiro.io.
 */

using System.Threading.Tasks;
using magic.node;
using magic.node.contracts;
using magic.node.extensions;
using magic.signals.contracts;
using Microsoft.Extensions.Configuration;

namespace magic.lambda.git
{
    /// <summary>
    /// [git.merge] slot to merge a branch into the current branch, or to abort a merge that stopped on conflicts.
    /// </summary>
    [Slot(
        Name = "git.merge",
        Description = "Merges a Git branch into the current branch, or aborts a merge that stopped on conflicts",
        ValueKind = "git-repo-path",
        ValueDescription = "Repository path",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "git-response,text",
        ReturnsDescription = "Resolves to the git merge command output",
        SignatureType = typeof(global::magic.lambda.git.signatures.GitMergeSignature))]
    public class GitMerge : ISlotAsync
    {
        readonly IRootResolver _rootResolver;
        readonly IConfiguration _configuration;

        public GitMerge(IRootResolver rootResolver, IConfiguration configuration)
        {
            _rootResolver = rootResolver;
            _configuration = configuration;
        }

        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            var args = GetArgs(input);

            var gitArgs = GitSlotHelpers.Args("merge");
            if (args.Abort)
            {
                gitArgs.Add("--abort");
            }
            else
            {
                gitArgs.Add("--no-edit");
                gitArgs.Add(args.Branch);
            }

            var repoPath = GitSlotHelpers.ResolveRepoPath(_rootResolver, args.Path);
            input.Value = await GitSlotHelpers.RunGitAsync(
                repoPath,
                gitArgs,
                GitSlotHelpers.WithIdentity(GitSlotHelpers.GetGitHubAuthArgs(_configuration), args.Name, args.Email));
        }

        #region [ -- Private helper methods -- ]

        static (string Path, string Branch, bool Abort, string Name, string Email) GetArgs(Node input)
        {
            var path = GitSlotHelpers.GetRequiredPrimaryValue(input);
            var abort = GitSlotHelpers.GetOptionalBool(input, "abort", false);
            var branch = GitSlotHelpers.GetOptionalChild(input, "branch");
            if (!abort)
            {
                if (string.IsNullOrWhiteSpace(branch))
                    throw new HyperlambdaException("Missing required argument 'branch'");
                GitSlotHelpers.EnsureNotOption(branch, "branch");
            }

            var name = GitSlotHelpers.GetOptionalChild(input, "name");
            var email = GitSlotHelpers.GetOptionalChild(input, "email");

            input.Clear();
            input.Value = null;

            return (path, branch, abort, name, email);
        }

        #endregion
    }
}
