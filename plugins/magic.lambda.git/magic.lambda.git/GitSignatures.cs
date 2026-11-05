/*
 * Copyright (c) AINIRO.IO, Ltd, 2021 - 2023 team@ainiro.io.
 */

using System.Collections.Generic;
using magic.signals.contracts;

namespace magic.lambda.git.signatures
{
    public abstract class GitSignature : ISlotSignature
    {
        protected const string StringType = "string";
        protected const string BoolType = "bool";
        protected const string False = "false";

        public virtual IEnumerable<SlotChild> Children => System.Array.Empty<SlotChild>();

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
            Option("remote", BoolType, "List remote branches", defaultValue: False),
            Option("all", BoolType, "List all branches", defaultValue: False),
        };
    }

    public class GitStatusSignature : GitSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("porcelain", BoolType, "Use porcelain status output", defaultValue: False),
            Option("branch", BoolType, "Include branch information", defaultValue: False),
            Option("structured", BoolType, "Return status lines as child nodes", defaultValue: False),
        };
    }

    public class GitDiffSignature : GitSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("file", StringType, "Repository-relative path of one file to diff; omitted diffs the whole repository", kind: "git-file-path"),
        };
    }

    public class GitRestoreSignature : GitSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("file", StringType, "Repository-relative path of one file to restore from HEAD; omitted resets the whole working tree to HEAD and removes untracked files", kind: "git-file-path"),
        };
    }

    public class GitPullSignature : GitSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("remote", StringType, "Remote to pull from", defaultValue: "origin", kind: "git-remote"),
            Option("branch", StringType, "Branch to pull", kind: "git-branch"),
            Option("rebase", BoolType, "Use rebase while pulling", defaultValue: False),
            Option("merge", BoolType, "Merge while pulling, which is what lets a diverged branch be pulled", defaultValue: False),
            Option("ff-only", BoolType, "Only allow fast-forward pulls", defaultValue: False),
            Option("name", StringType, "Author name of the merge commit a merging pull creates"),
            Option("email", StringType, "Author email of the merge commit a merging pull creates"),
        };
    }

    public class GitMergeSignature : GitSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("branch", StringType, "Branch to merge into the current branch, required unless [abort] is true", kind: "git-branch"),
            Option("abort", BoolType, "Abort a merge that stopped on conflicts", defaultValue: False),
            Option("name", StringType, "Author name of the merge commit"),
            Option("email", StringType, "Author email of the merge commit"),
        };
    }

    public class GitLogSignature : GitSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("range", StringType, "Revision range, such as 'HEAD...@{u}' for the commits that differ from the upstream; omitted lists the current branch"),
            Option("limit", "int", "Maximum number of commits to return", defaultValue: "30"),
        };
    }

    public class GitFetchSignature : GitSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("remote", StringType, "Remote to fetch from", defaultValue: "origin", kind: "git-remote"),
            Option("refspec", StringType, "Optional refspec to fetch", kind: "git-refspec"),
        };
    }

    public class GitRemoteAddSignature : GitSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("name", StringType, "Remote name", defaultValue: "origin", kind: "git-remote"),
            Option("url", StringType, "Remote URL", true, kind: "git-url"),
        };
    }

    public class GitCloneRepoSignature : GitSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("path", StringType, "Destination repository folder", kind: "git-repo-path"),
            Option("branch", StringType, "Branch to clone", kind: "git-branch"),
            Option("depth", "int", "Shallow clone depth"),
        };
    }

    public class GitCreateRepoSignature : GitSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("branch", StringType, "Initial branch name", kind: "git-branch"),
            Option("bare", BoolType, "Create a bare repository", defaultValue: False),
        };
    }

    public class GitCommitSignature : GitSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("message", StringType, "Commit message", true, kind: "commit-message"),
            Option("all", BoolType, "Stage all changed files before committing", defaultValue: "true"),
            Option("amend", BoolType, "Amend the previous commit", defaultValue: False),
            Option("name", StringType, "Author name for the commit; omitted falls back to git's configured identity"),
            Option("email", StringType, "Author email for the commit; omitted falls back to git's configured identity"),
        };
    }

    public class GitPushSignature : GitSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("remote", StringType, "Remote to push to", defaultValue: "origin", kind: "git-remote"),
            Option("branch", StringType, "Branch to push", kind: "git-branch"),
            Option("set-upstream", BoolType, "Set upstream while pushing", defaultValue: False),
        };
    }

    public class GitCheckoutSignature : GitSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("branch", StringType, "Branch to check out", true, kind: "git-branch"),
            Option("create", BoolType, "Create the branch while checking it out", defaultValue: False),
        };
    }

    public class GitHubRepoCreateSignature : GitSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("owner", StringType, "Organization owner; omit to create under the authenticated user", kind: "github-owner"),
            Option("private", BoolType, "Whether the repository is private", defaultValue: False),
            Option("description", StringType, "Repository description", kind: "git-repo-description"),
            Option("homepage", StringType, "Repository homepage URL", kind: "url"),
            Option("auto-init", BoolType, "Initialize the repository", defaultValue: False),
            Option("default-branch", StringType, "Default branch name", kind: "git-branch"),
            Option("gitignore-template", StringType, "GitHub gitignore template", kind: "gitignore-template"),
            Option("license-template", StringType, "GitHub license template", kind: "license-template"),
        };
    }

    public class GitHubRepoDeleteSignature : GitSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("owner", StringType, "Repository owner; omit to delete from the authenticated user", kind: "github-owner"),
        };
    }

    public class GitHubRepoListSignature : GitSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("owner", StringType, "Organization owner; omit to list authenticated user repositories", kind: "github-owner"),
            Option("visibility", StringType, "Repository visibility filter", kind: "repo-visibility"),
            Option("type", StringType, "Repository type filter", kind: "repo-type"),
            Option("per-page", "int", "Number of repositories per page"),
            Option("page", "int", "Page number"),
        };
    }
}
