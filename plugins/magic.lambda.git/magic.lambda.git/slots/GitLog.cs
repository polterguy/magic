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
    /// [git.log] slot to list commits, optionally only those in a revision range.
    /// </summary>
    [Slot(
        Name = "git.log",
        Description = "Lists commits, one per line as side, hash, author, age and subject separated by tabs, where side is '<' for a commit only on the left of a range and '>' for one only on the right",
        ValueKind = "git-repo-path",
        ValueDescription = "Repository path",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "git-log,text",
        ReturnsDescription = "Resolves to the commit lines",
        SignatureType = typeof(global::magic.lambda.git.signatures.GitLogSignature))]
    public class GitLog : ISlotAsync
    {
        readonly IRootResolver _rootResolver;
        readonly IConfiguration _configuration;

        public GitLog(IRootResolver rootResolver, IConfiguration configuration)
        {
            _rootResolver = rootResolver;
            _configuration = configuration;
        }

        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            var args = GetArgs(input);

            var gitArgs = GitSlotHelpers.Args(
                "log",
                "--left-right",
                "--format=%m%x09%h%x09%an%x09%ar%x09%s",
                "-n",
                args.Limit.ToString());
            if (!string.IsNullOrWhiteSpace(args.Range))
                gitArgs.Add(args.Range);

            var repoPath = GitSlotHelpers.ResolveRepoPath(_rootResolver, args.Path);
            input.Value = await GitSlotHelpers.RunGitAsync(
                repoPath,
                gitArgs,
                GitSlotHelpers.GetGitHubAuthArgs(_configuration));
        }

        #region [ -- Private helper methods -- ]

        static (string Path, string Range, int Limit) GetArgs(Node input)
        {
            var path = GitSlotHelpers.GetRequiredPrimaryValue(input);
            var range = GitSlotHelpers.GetOptionalChild(input, "range");
            if (!string.IsNullOrWhiteSpace(range))
                GitSlotHelpers.EnsureNotOption(range, "range");
            var limit = input.Children.FirstOrDefault(x => x.Name == "limit")?.GetEx<int>() ?? 30;

            input.Clear();
            input.Value = null;

            return (path, range, limit);
        }

        #endregion
    }
}
