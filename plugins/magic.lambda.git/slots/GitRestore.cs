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
    /// [git.restore] slot to discard uncommitted changes, for one file or the whole repository.
    /// </summary>
    [Slot(
        Name = "git.restore",
        Description = "Discards uncommitted changes by restoring one file from HEAD, or resets the whole working tree to HEAD including removal of untracked files",
        ValueKind = "git-repo-path",
        ValueDescription = "Repository path",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "git-response,text",
        ReturnsDescription = "Resolves to the git command output",
        SignatureType = typeof(global::magic.lambda.git.signatures.GitRestoreSignature))]
    public class GitRestore : ISlotAsync
    {
        readonly IRootResolver _rootResolver;
        readonly IConfiguration _configuration;

        public GitRestore(IRootResolver rootResolver, IConfiguration configuration)
        {
            _rootResolver = rootResolver;
            _configuration = configuration;
        }

        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            var args = GetArgs(input);
            var repoPath = GitSlotHelpers.ResolveRepoPath(_rootResolver, args.Path);
            var authArgs = GitSlotHelpers.GetGitHubAuthArgs(_configuration);

            if (!string.IsNullOrWhiteSpace(args.File))
            {
                // Restores both index and working tree for one file.
                input.Value = await GitSlotHelpers.RunGitAsync(
                    repoPath,
                    GitSlotHelpers.Args("checkout", "HEAD", "--", args.File),
                    authArgs);
                return;
            }

            /*
             * Whole repository: tracked changes are thrown away, then untracked
             * files and folders are removed, leaving the working tree identical to HEAD.
             */
            var result = await GitSlotHelpers.RunGitAsync(
                repoPath,
                GitSlotHelpers.Args("reset", "--hard", "HEAD"),
                authArgs);
            await GitSlotHelpers.RunGitAsync(
                repoPath,
                GitSlotHelpers.Args("clean", "-fd"),
                authArgs);
            input.Value = result;
        }

        #region [ -- Private helper methods -- ]

        (string Path, string File) GetArgs(Node input)
        {
            var path = GitSlotHelpers.GetRequiredPrimaryValue(input);
            var file = GitSlotHelpers.GetOptionalChild(input, "file");

            input.Clear();
            input.Value = null;

            return (path, file);
        }

        #endregion
    }
}
