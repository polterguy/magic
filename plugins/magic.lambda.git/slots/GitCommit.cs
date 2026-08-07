/*
 * Copyright (c) Thomas Hansen, 2021 - 2023 thomas@ainiro.io.
 */

using System.Threading.Tasks;
using System.Collections.Generic;
using magic.node;
using magic.node.contracts;
using magic.node.extensions;
using magic.signals.contracts;
using Microsoft.Extensions.Configuration;

namespace magic.lambda.git
{
    /// <summary>
    /// [git.commit] slot to create a commit in a repo.
    /// </summary>
    [Slot(
        Name = "git.commit",
        Description = "Stages all changes in the repo and creates a new commit with the supplied message and author",
        ValueKind = "git-repo-path",
        ValueDescription = "Repository path",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "git-response,text",
        ReturnsDescription = "Resolves to the git commit command output",
        SignatureType = typeof(global::magic.lambda.git.signatures.GitCommitSignature))]
    public class GitCommit : ISlotAsync
    {
        readonly IRootResolver _rootResolver;
        readonly IConfiguration _configuration;

        public GitCommit(IRootResolver rootResolver, IConfiguration configuration)
        {
            _rootResolver = rootResolver;
            _configuration = configuration;
        }

        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            var args = GetArgs(input);

            var repoPath = GitSlotHelpers.ResolveRepoPath(_rootResolver, args.Path);

            if (args.AddAll)
                await GitSlotHelpers.RunGitAsync(
                    repoPath,
                    GitSlotHelpers.Args("add", "-A"),
                    GitSlotHelpers.GetGitHubAuthArgs(_configuration));

            var gitArgs = GitSlotHelpers.Args("commit", "-m", args.Message);
            if (args.Amend)
                gitArgs.Add("--amend");

            // Author identity injected per invocation, keeping the plugin free of filesystem git config.
            var extraArgs = new List<string>(GitSlotHelpers.GetGitHubAuthArgs(_configuration));
            if (!string.IsNullOrWhiteSpace(args.Name))
            {
                extraArgs.Add("-c");
                extraArgs.Add($"user.name={args.Name}");
            }
            if (!string.IsNullOrWhiteSpace(args.Email))
            {
                extraArgs.Add("-c");
                extraArgs.Add($"user.email={args.Email}");
            }

            input.Value = await GitSlotHelpers.RunGitAsync(
                repoPath,
                gitArgs,
                extraArgs);
        }

        #region [ -- Private helper methods -- ]

        (string Path, string Message, bool AddAll, bool Amend, string Name, string Email) GetArgs(Node input)
        {
            var path = GitSlotHelpers.GetRequiredPrimaryValue(input);
            var message = GitSlotHelpers.GetOptionalChild(input, "message");
            if (string.IsNullOrWhiteSpace(message))
                throw new HyperlambdaException("Missing required argument 'message'");

            var addAll = GitSlotHelpers.GetOptionalBool(input, "all", true);
            var amend = GitSlotHelpers.GetOptionalBool(input, "amend", false);
            var name = GitSlotHelpers.GetOptionalChild(input, "name");
            var email = GitSlotHelpers.GetOptionalChild(input, "email");

            input.Clear();
            input.Value = null;

            return (path, message, addAll, amend, name, email);
        }

        #endregion
    }
}
