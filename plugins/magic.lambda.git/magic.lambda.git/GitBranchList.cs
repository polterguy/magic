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
    /// [git.branch.list] slot to list branches.
    /// </summary>
    [Slot(
        Name = "git.branch.list",
        Description = "Returns every branch in the local repository, marking which one is currently checked out",
        ValueKind = "git-repo-path",
        ValueDescription = "Repository path",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.Lambda,
        ReturnsKind = "git-branch-list,string-list",
        ReturnsElementKind = "git-branch,text",
        ReturnsDescription = "Returns one unnamed child node per git branch name",
        SignatureType = typeof(global::magic.lambda.git.signatures.GitBranchListSignature))]
    public class GitBranchList : ISlotAsync
    {
        readonly IRootResolver _rootResolver;
        readonly IConfiguration _configuration;

        public GitBranchList(IRootResolver rootResolver, IConfiguration configuration)
        {
            _rootResolver = rootResolver;
            _configuration = configuration;
        }

        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            var args = GetArgs(input);

            var gitArgs = GitSlotHelpers.Args("branch");
            if (args.Remote)
                gitArgs.Add("-r");
            if (args.All)
                gitArgs.Add("-a");

            var repoPath = GitSlotHelpers.ResolveRepoPath(_rootResolver, args.Path);
            var result = await GitSlotHelpers.RunGitAsync(
                repoPath,
                gitArgs,
                GitSlotHelpers.GetGitHubAuthArgs(_configuration));

            input.Clear();
            input.Value = null;
            if (!string.IsNullOrWhiteSpace(result))
            {
                foreach (var line in result.Split('\n'))
                {
                    var name = line.Trim().TrimStart('*').Trim();
                    if (string.IsNullOrWhiteSpace(name))
                        continue;
                    input.Add(new Node(".", name));
                }
            }
        }

        #region [ -- Private helper methods -- ]

        static (string Path, bool Remote, bool All) GetArgs(Node input)
        {
            var path = GitSlotHelpers.GetRequiredPrimaryValue(input);
            var remote = input.Children.FirstOrDefault(x => x.Name == "remote")?.GetEx<bool>() ?? false;
            var all = input.Children.FirstOrDefault(x => x.Name == "all")?.GetEx<bool>() ?? false;

            input.Clear();
            input.Value = null;

            return (path, remote, all);
        }

        #endregion
    }
}
