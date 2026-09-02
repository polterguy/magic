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
    /// [git.diff] slot to show the working tree changes relative to HEAD.
    /// </summary>
    [Slot(
        Name = "git.diff",
        Description = "Returns the unified diff between the working tree and HEAD, for the whole repository or one file",
        ValueKind = "git-repo-path",
        ValueDescription = "Repository path",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "git-diff,text",
        ReturnsDescription = "Returns the unified diff text",
        SignatureType = typeof(global::magic.lambda.git.signatures.GitDiffSignature))]
    public class GitDiff : ISlotAsync
    {
        readonly IRootResolver _rootResolver;
        readonly IConfiguration _configuration;

        public GitDiff(IRootResolver rootResolver, IConfiguration configuration)
        {
            _rootResolver = rootResolver;
            _configuration = configuration;
        }

        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            var args = GetArgs(input);

            /*
             * HEAD is the base since [git.commit] stages everything, implying the
             * working tree versus HEAD is exactly what the next commit contains.
             */
            var gitArgs = GitSlotHelpers.Args("diff", "HEAD");
            if (!string.IsNullOrWhiteSpace(args.File))
            {
                gitArgs.Add("--");
                gitArgs.Add(args.File);
            }

            var repoPath = GitSlotHelpers.ResolveRepoPath(_rootResolver, args.Path);
            input.Value = await GitSlotHelpers.RunGitAsync(
                repoPath,
                gitArgs,
                GitSlotHelpers.GetGitHubAuthArgs(_configuration));
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
