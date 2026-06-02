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
    /// [git.checkout] slot to switch branches, optionally creating it.
    /// </summary>
    [Slot(
        Name = "git.checkout",
        Description = "Checks out a Git branch",
        ValueKind = "git-repo-path",
        ValueDescription = "Repository path",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "git-response,text",
        ReturnsDescription = "Resolves to the git checkout command output",
        SignatureType = typeof(global::magic.lambda.git.signatures.GitCheckoutSignature))]
    public class GitCheckout : ISlotAsync
    {
        readonly IRootResolver _rootResolver;
        readonly IConfiguration _configuration;

        public GitCheckout(IRootResolver rootResolver, IConfiguration configuration)
        {
            _rootResolver = rootResolver;
            _configuration = configuration;
        }

        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            var args = GetArgs(input);

            var gitArgs = GitSlotHelpers.Args("checkout");
            if (args.Create)
                gitArgs.Add("-b");
            gitArgs.Add(args.Branch);

            var repoPath = GitSlotHelpers.ResolveRepoPath(_rootResolver, args.Path);
            input.Value = await GitSlotHelpers.RunGitAsync(
                repoPath,
                gitArgs,
                GitSlotHelpers.GetGitHubAuthArgs(_configuration));
        }

        #region [ -- Private helper methods -- ]

        (string Path, string Branch, bool Create) GetArgs(Node input)
        {
            var path = GitSlotHelpers.GetRequiredPrimaryValue(input);
            var branch = GitSlotHelpers.GetOptionalChild(input, "branch");
            if (string.IsNullOrWhiteSpace(branch))
                throw new HyperlambdaException("Missing required argument 'branch'");

            var create = GitSlotHelpers.GetOptionalBool(input, "create", false);

            input.Clear();
            input.Value = null;

            return (path, branch, create);
        }

        #endregion
    }
}
