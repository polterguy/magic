---
title: magic.lambda.git
---

The magic.lambda.git project provides Git and GitHub invocation capabilities for Magic and Hyperlambda. More specifically the
project contains the following 14 slots.

* __[git.clone-repo]__ - Clones a repository into a folder
* __[git.create-repo]__ - Initializes a folder as a Git repository
* __[git.delete-repo]__ - Deletes an existing repository folder
* __[git.commit]__ - Adds files and creates a commit
* __[git.push]__ - Pushes commits to a remote
* __[git.checkout]__ - Switches branches (optionally creating a new branch)
* __[git.remote.add]__ - Adds a Git remote
* __[git.fetch]__ - Fetches updates from a remote
* __[git.pull]__ - Pulls updates from a remote
* __[git.status]__ - Shows repository status
* __[git.branch.list]__ - Lists branches
* __[github.repo.create]__ - Creates a GitHub repository
* __[github.repo.delete]__ - Deletes a GitHub repository
* __[github.repo.list]__ - Lists GitHub repositories

All slots use the Git CLI under the hood. Paths are always resolved **inside** your _"/files/"_ folder using
`IRootResolver`, and folder paths **must** start with `/` and end with `/`.

**Notice** - The primary argument to all slots is always the node value. Optional arguments must be provided
as child nodes. Folder paths are required to start with `/` and end with `/`.

**Notice** - The given folder must itself be the repository root. Git's normal upward repository discovery
is disabled, implying a folder that isn't itself a repo throws instead of silently resolving to an
enclosing ancestor repository.

## GitHub authentication (HTTPS)

If you use HTTPS for GitHub, the slots will inject a per-command `Authorization` header using values from
`IConfiguration`. Add these keys:

```
magic:git:github:username
magic:git:github:token
magic:git:github:host
magic:git:github:api-base
```

The `host` value defaults to `github.com` if not provided. The `api-base` value defaults to
`https://api.github.com`, but should be set to your GitHub Enterprise API base URL if you use it
(typically `https://your-ghe-domain/api/v3`).

## How to use [git.clone-repo]

Clones the specified URL. The URL is the node value. Optionally provide `path`, `branch`, and `depth`.

```
git.clone-repo:"https://github.com/polterguy/stripe.git"
   path:/modules/stripe/
```

```
git.clone-repo:"https://github.com/polterguy/stripe.git"
   path:/modules/stripe/
   branch:main
   depth:1
```

## How to use [git.create-repo]

Initializes a folder as a repository. The folder path is the node value.

```
git.create-repo:/modules/new-repo/
```

Optional arguments:

* __[branch]__ - Initial branch name
* __[bare]__ - Boolean, creates a bare repo

```
git.create-repo:/modules/new-repo/
   branch:main
   bare:false
```

## How to use [git.delete-repo]

Deletes the repository folder. The folder path is the node value.

```
git.delete-repo:/modules/old-repo/
```

## How to use [git.commit]

Creates a commit. The repo path is the node value. The `message` child node is required.

```
git.commit:/modules/stripe/
   message:Initial commit
```

Optional arguments:

* __[all]__ - Boolean, default true, runs `git add -A` before commit
* __[amend]__ - Boolean, amends the previous commit
* __[name]__ - Author name for the commit, falling back to git's configured identity when omitted
* __[email]__ - Author email for the commit, falling back to git's configured identity when omitted

Author identity is injected per invocation the same way authentication is, implying nothing is ever
written to the global git configuration on the server.

Optional arguments:

* __[all]__ - Boolean, default true, runs `git add -A` before commit
* __[amend]__ - Boolean, amends the previous commit

```
git.commit:/modules/stripe/
   message:"Fix issue"
   all:true
   amend:false
```

## How to use [git.push]

Pushes to a remote. The repo path is the node value.

```
git.push:/modules/stripe/
   remote:origin
   branch:main
```

Optional arguments:

* __[set-upstream]__ - Boolean, adds `-u` to the push

```
git.push:/modules/stripe/
   remote:origin
   branch:main
   set-upstream:true
```

## How to use [git.checkout]

Switches branches in a repo. The repo path is the node value. The `branch` child node is required.

```
git.checkout:/modules/stripe/
   branch:feature-x
```

Optional argument:

* __[create]__ - Boolean, creates the branch

```
git.checkout:/modules/stripe/
   branch:feature-x
   create:true
```

## How to use [git.remote.add]

Adds a remote to a repository. The repo path is the node value. The `url` child node is required.
The `name` child node defaults to `origin` if omitted.

```
git.remote.add:/modules/stripe/
   url:"https://github.com/polterguy/stripe.git"
```

```
git.remote.add:/modules/stripe/
   name:origin
   url:"https://github.com/polterguy/stripe.git"
```

## How to use [git.fetch]

Fetches updates from a remote. The repo path is the node value. The `remote` child node defaults to `origin`.

```
git.fetch:/modules/stripe/
```

```
git.fetch:/modules/stripe/
   remote:origin
   refspec:main
```

## How to use [git.pull]

Pulls updates from a remote. The repo path is the node value. The `remote` child node defaults to `origin`.

```
git.pull:/modules/stripe/
```

```
git.pull:/modules/stripe/
   remote:origin
   branch:main
   rebase:false
   ff-only:false
```

## How to use [git.status]

Shows repo status. The repo path is the node value. By default this returns the raw `git status` output.
If you provide `structured:true`, each line is returned as a `.` node.

```
git.status:/modules/stripe/
```

```
git.status:/modules/stripe/
   porcelain:true
   branch:true
   structured:true
```

## How to use [git.branch.list]

Lists branches. The repo path is the node value. Each branch is returned as a `.` node.

```
git.branch.list:/modules/stripe/
```

```
git.branch.list:/modules/stripe/
   remote:true
```

```
git.branch.list:/modules/stripe/
   all:true
```

## How to use [github.repo.create]

Creates a GitHub repository. The repository name is the node value. Optionally provide an
organization owner and additional settings.

```
github.repo.create:my-new-repo
```

```
github.repo.create:my-new-repo
   owner:my-org
   private:true
   description:"Example repo"
   homepage:"https://example.com"
   auto-init:true
   default-branch:main
```

Optional arguments:

* __[owner]__ - Organization name to create repo within (omit to create under authenticated user)
* __[private]__ - Boolean
* __[description]__ - String
* __[homepage]__ - String
* __[auto-init]__ - Boolean
* __[default-branch]__ - String
* __[gitignore-template]__ - String
* __[license-template]__ - String

## How to use [github.repo.delete]

Deletes a GitHub repository. The repository name is the node value. The `owner` argument is optional,
and defaults to the configured `magic:git:github:username`.

```
github.repo.delete:my-old-repo
```

```
github.repo.delete:my-old-repo
   owner:my-org
```

## How to use [github.repo.list]

Lists GitHub repositories. If `owner` is omitted, it will list repositories visible to the
authenticated user. If `owner` is provided, it will list repositories for the organization (not a user).

**Notice** - For the authenticated user endpoint, GitHub does not allow combining `visibility` and `type`.
Provide only one of them.

The result is returned as a list, each containing the following fields:

* `name`
* `full_name`
* `private`
* `html_url`
* `description`
* `default_branch`

```
github.repo.list
   owner:my-org
   visibility:all
   type:all
   per-page:100
   page:1
```
