/*
 * Copyright (c) Thomas Hansen, 2021 - 2023 thomas@ainiro.io.
 */

using System.Collections.Generic;
using magic.signals.contracts;

namespace magic.lambda.git.signatures
{
    public abstract class GitSignature : ISlotSignature
    {
        public virtual IEnumerable<SlotChild> Children => new SlotChild[0];

        protected static SlotChild Option(string name, string type, string description, bool required = false, string defaultValue = null, string kind = null)
        {
            return new SlotChild
            {
                Name = name,
                Type = type,
                Kind = kind,
                Description = description,
                Required = required,
                DefaultValue = defaultValue,
                Mode = SlotChildMode.ValueOrExpression,
                Cardinality = required ? SlotChildCardinality.ExactlyOne : SlotChildCardinality.ZeroOrOne,
                Role = SlotChildRole.Option,
                Projection = SlotChildProjection.Value,
            };
        }
    }

    public class GitBranchListSignature : GitSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("remote", "bool", "List remote branches", defaultValue: "false"),
            Option("all", "bool", "List all branches", defaultValue: "false"),
        };
    }

    public class GitStatusSignature : GitSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("porcelain", "bool", "Use porcelain status output", defaultValue: "false"),
            Option("branch", "bool", "Include branch information", defaultValue: "false"),
            Option("structured", "bool", "Return status lines as child nodes", defaultValue: "false"),
        };
    }

    public class GitPullSignature : GitSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("remote", "string", "Remote to pull from", defaultValue: "origin", kind: "git-remote"),
            Option("branch", "string", "Branch to pull", kind: "git-branch"),
            Option("rebase", "bool", "Use rebase while pulling", defaultValue: "false"),
            Option("ff-only", "bool", "Only allow fast-forward pulls", defaultValue: "false"),
        };
    }

    public class GitFetchSignature : GitSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("remote", "string", "Remote to fetch from", defaultValue: "origin", kind: "git-remote"),
            Option("refspec", "string", "Optional refspec to fetch", kind: "git-refspec"),
        };
    }

    public class GitRemoteAddSignature : GitSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("name", "string", "Remote name", defaultValue: "origin", kind: "git-remote"),
            Option("url", "string", "Remote URL", true, kind: "git-url"),
        };
    }

    public class GitCloneRepoSignature : GitSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("path", "string", "Destination repository folder", kind: "git-repo-path"),
            Option("branch", "string", "Branch to clone", kind: "git-branch"),
            Option("depth", "int", "Shallow clone depth"),
        };
    }

    public class GitCreateRepoSignature : GitSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("branch", "string", "Initial branch name", kind: "git-branch"),
            Option("bare", "bool", "Create a bare repository", defaultValue: "false"),
        };
    }

    public class GitCommitSignature : GitSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("message", "string", "Commit message", true, kind: "commit-message"),
            Option("all", "bool", "Stage all changed files before committing", defaultValue: "true"),
            Option("amend", "bool", "Amend the previous commit", defaultValue: "false"),
            Option("name", "string", "Author name for the commit; omitted falls back to git's configured identity"),
            Option("email", "string", "Author email for the commit; omitted falls back to git's configured identity"),
        };
    }

    public class GitPushSignature : GitSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("remote", "string", "Remote to push to", defaultValue: "origin", kind: "git-remote"),
            Option("branch", "string", "Branch to push", kind: "git-branch"),
            Option("set-upstream", "bool", "Set upstream while pushing", defaultValue: "false"),
        };
    }

    public class GitCheckoutSignature : GitSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("branch", "string", "Branch to check out", true, kind: "git-branch"),
            Option("create", "bool", "Create the branch while checking it out", defaultValue: "false"),
        };
    }

    public class GitHubRepoCreateSignature : GitSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("owner", "string", "Organization owner; omit to create under the authenticated user", kind: "github-owner"),
            Option("private", "bool", "Whether the repository is private", defaultValue: "false"),
            Option("description", "string", "Repository description", kind: "git-repo-description"),
            Option("homepage", "string", "Repository homepage URL", kind: "url"),
            Option("auto-init", "bool", "Initialize the repository", defaultValue: "false"),
            Option("default-branch", "string", "Default branch name", kind: "git-branch"),
            Option("gitignore-template", "string", "GitHub gitignore template", kind: "gitignore-template"),
            Option("license-template", "string", "GitHub license template", kind: "license-template"),
        };
    }

    public class GitHubRepoDeleteSignature : GitSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("owner", "string", "Repository owner; omit to delete from the authenticated user", kind: "github-owner"),
        };
    }

    public class GitHubRepoListSignature : GitSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("owner", "string", "Organization owner; omit to list authenticated user repositories", kind: "github-owner"),
            Option("visibility", "string", "Repository visibility filter", kind: "repo-visibility"),
            Option("type", "string", "Repository type filter", kind: "repo-type"),
            Option("per-page", "int", "Number of repositories per page"),
            Option("page", "int", "Page number"),
        };
    }
}
