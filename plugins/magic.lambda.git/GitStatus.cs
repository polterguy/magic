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
    /// [git.status] slot to show repository status.
    /// </summary>
    [Slot(
        Name = "git.status",
        Description = "Returns Git repository status",
        ValueKind = "git-repo-path",
        ValueDescription = "Repository path",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.Both,
        ReturnsKind = "git-status,text",
        ReturnsDescription = "Returns Git status text in value or, when structured, one child node per status line",
        SignatureType = typeof(global::magic.lambda.git.signatures.GitStatusSignature))]
    public class GitStatus : ISlotAsync
    {
        readonly IRootResolver _rootResolver;
        readonly IConfiguration _configuration;

        public GitStatus(IRootResolver rootResolver, IConfiguration configuration)
        {
            _rootResolver = rootResolver;
            _configuration = configuration;
        }

        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            var args = GetArgs(input);

            var gitArgs = GitSlotHelpers.Args("status");
            if (args.Porcelain)
                gitArgs.Add("--porcelain");
            if (args.Branch)
                gitArgs.Add("--branch");

            var repoPath = GitSlotHelpers.ResolveRepoPath(_rootResolver, args.Path);
            var result = await GitSlotHelpers.RunGitAsync(
                repoPath,
                gitArgs,
                GitSlotHelpers.GetGitHubAuthArgs(_configuration));

            if (args.Structured)
            {
                input.Clear();
                input.Value = null;
                if (!string.IsNullOrWhiteSpace(result))
                {
                    foreach (var line in result.Split('\n'))
                        input.Add(new Node(".", line.TrimEnd('\r')));
                }
            }
            else
            {
                input.Value = result;
            }
        }

        #region [ -- Private helper methods -- ]

        static (string Path, bool Porcelain, bool Branch, bool Structured) GetArgs(Node input)
        {
            var path = GitSlotHelpers.GetRequiredPrimaryValue(input);
            var porcelain = input.Children.FirstOrDefault(x => x.Name == "porcelain")?.GetEx<bool>() ?? false;
            var branch = input.Children.FirstOrDefault(x => x.Name == "branch")?.GetEx<bool>() ?? false;
            var structured = input.Children.FirstOrDefault(x => x.Name == "structured")?.GetEx<bool>() ?? false;

            input.Clear();
            input.Value = null;

            return (path, porcelain, branch, structured);
        }

        #endregion
    }
}
