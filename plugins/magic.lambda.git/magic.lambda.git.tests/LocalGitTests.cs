/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Xunit;
using magic.node;
using magic.node.extensions;

namespace magic.lambda.git.tests
{
    public class LocalGitTests
    {
        static string Identity => Runtime.Identity;

        #region [ -- Guards -- ]

        [Theory]
        [InlineData("repo/")]
        [InlineData("/repo")]
        [InlineData("")]
        [InlineData("/../outside/")]
        public async Task BadFolderPathsAreRejected(string path)
        {
            using var runtime = new Runtime();
            await Assert.ThrowsAsync<HyperlambdaException>(() => runtime.Call("git.status", path));
        }

        [Fact]
        public async Task MissingRepositoryPathThrows()
        {
            using var runtime = new Runtime();
            var ex = await Assert.ThrowsAsync<HyperlambdaException>(() => runtime.Call("git.status", null));
            Assert.Contains("Missing required argument value", ex.Message);
        }

        [GitFact]
        public async Task StatusOfAFolderThatIsNotARepositoryThrows()
        {
            using var runtime = new Runtime();
            Directory.CreateDirectory(runtime.FullPath("plain"));
            await Assert.ThrowsAsync<HyperlambdaException>(() => runtime.Call("git.status", "/plain/"));
        }

        [GitFact]
        public async Task OptionsCannotBePassedAsArguments()
        {
            using var runtime = new Runtime();
            await runtime.Repo("/repo/");
            await Assert.ThrowsAsync<HyperlambdaException>(() => runtime.Call("git.log", "/repo/", ("range", "--all")));
            await Assert.ThrowsAsync<HyperlambdaException>(() => runtime.Call("git.merge", "/repo/", ("branch", "--abort")));
        }

        [Fact]
        public async Task DeleteRefusesTheDynamicRoot()
        {
            using var runtime = new Runtime();
            var ex = await Assert.ThrowsAsync<HyperlambdaException>(() => runtime.Call("git.delete-repo", "/"));
            Assert.Contains("Refusing to delete", ex.Message);
            Assert.True(Directory.Exists(runtime.Root));
        }

        [Fact]
        public async Task DeleteRemovesAFolderAndIgnoresMissingOnes()
        {
            using var runtime = new Runtime();
            Directory.CreateDirectory(runtime.FullPath("gone/inner"));
            File.WriteAllText(runtime.FullPath("gone/inner/x.txt"), "x");
            await runtime.Call("git.delete-repo", "/gone/");
            Assert.False(Directory.Exists(runtime.FullPath("gone")));
            await runtime.Call("git.delete-repo", "/never-existed/");
        }

        #endregion

        #region [ -- Creating, committing and inspecting -- ]

        [GitFact]
        public async Task CreateRepoMakesARepositoryOnTheGivenBranch()
        {
            using var runtime = new Runtime();
            await runtime.Call("git.create-repo", "/repo/", ("branch", "trunk"));
            Assert.True(Directory.Exists(runtime.FullPath("repo/.git")));
            Assert.Contains("trunk", File.ReadAllText(runtime.FullPath("repo/.git/HEAD")));
        }

        [GitFact]
        public async Task CreateBareRepoHasNoWorkingTree()
        {
            using var runtime = new Runtime();
            await runtime.Call("git.create-repo", "/bare.git/", ("bare", true), ("branch", "main"));
            Assert.True(File.Exists(runtime.FullPath("bare.git/HEAD")));
            Assert.False(Directory.Exists(runtime.FullPath("bare.git/.git")));
        }

        [GitFact]
        public async Task StatusReportsUntrackedAndCommittedFiles()
        {
            using var runtime = new Runtime();
            await runtime.Repo("/repo/");
            File.WriteAllText(runtime.FullPath("repo/b.txt"), "new");
            var porcelain = await runtime.Call("git.status", "/repo/", ("porcelain", true));
            Assert.Equal("?? b.txt", porcelain.Get<string>());
            var withBranch = await runtime.Call("git.status", "/repo/", ("porcelain", true), ("branch", true));
            Assert.StartsWith("## main", withBranch.Get<string>());
            var plain = await runtime.Call("git.status", "/repo/");
            Assert.Contains("Untracked files", plain.Get<string>());
        }

        [GitFact]
        public async Task StatusCanBeReturnedAsLines()
        {
            using var runtime = new Runtime();
            await runtime.Repo("/repo/");
            File.WriteAllText(runtime.FullPath("repo/b.txt"), "new");
            File.WriteAllText(runtime.FullPath("repo/c.txt"), "new");
            var structured = await runtime.Call("git.status", "/repo/", ("porcelain", true), ("structured", true));
            Assert.Null(structured.Value);
            Assert.Equal(["?? b.txt", "?? c.txt"], structured.Children.Select(x => x.Get<string>()).ToArray());
            var again = await runtime.Call("git.status", "/repo/", ("porcelain", true), ("structured", true));
            Assert.Equal(2, again.Children.Count());
        }

        [GitFact]
        public async Task StructuredStatusOfACleanRepositoryHasNoLines()
        {
            using var runtime = new Runtime();
            await runtime.Repo("/repo/");
            var node = await runtime.Call("git.status", "/repo/", ("porcelain", true), ("structured", true));
            Assert.Empty(node.Children);
        }

        [GitFact]
        public async Task CommitStagesEverythingAndReportsIt()
        {
            using var runtime = new Runtime();
            await runtime.Repo("/repo/");
            File.WriteAllText(runtime.FullPath("repo/b.txt"), "new");
            var commit = await runtime.Commit("/repo/", "second");
            Assert.Contains("second", commit.Get<string>());
            var status = await runtime.Call("git.status", "/repo/", ("porcelain", true));
            Assert.True(string.IsNullOrEmpty(status.Get<string>()));
        }

        [GitFact]
        public async Task CommitWithoutAllLeavesChangesUnstaged()
        {
            using var runtime = new Runtime();
            await runtime.Repo("/repo/");
            File.WriteAllText(runtime.FullPath("repo/a.txt"), "changed");
            await Assert.ThrowsAsync<HyperlambdaException>(() => runtime.Call("git.commit", "/repo/",
                ("message", "nothing staged"), ("all", false), ("name", Identity), ("email", "t@example.com")));
        }

        [GitFact]
        public async Task CommitRequiresAMessage()
        {
            using var runtime = new Runtime();
            await runtime.Repo("/repo/");
            var ex = await Assert.ThrowsAsync<HyperlambdaException>(() => runtime.Call("git.commit", "/repo/"));
            Assert.Contains("'message'", ex.Message);
        }

        [GitFact]
        public async Task AmendReplacesTheLastCommit()
        {
            using var runtime = new Runtime();
            await runtime.Repo("/repo/");
            File.WriteAllText(runtime.FullPath("repo/a.txt"), "amended");
            await runtime.Call("git.commit", "/repo/", ("message", "first, amended"), ("amend", true), ("name", Identity), ("email", "t@example.com"));
            var log = await runtime.Call("git.log", "/repo/");
            Assert.Single(log.Get<string>().Split('\n'));
            Assert.Contains("first, amended", log.Get<string>());
        }

        [GitFact]
        public async Task LogListsCommitsNewestFirstAndHonoursLimitAndRange()
        {
            using var runtime = new Runtime();
            await runtime.Repo("/repo/");
            File.WriteAllText(runtime.FullPath("repo/a.txt"), "two");
            await runtime.Commit("/repo/", "second");
            File.WriteAllText(runtime.FullPath("repo/a.txt"), "three");
            await runtime.Commit("/repo/", "third");

            var all = (await runtime.Call("git.log", "/repo/")).Get<string>().Split('\n');
            Assert.Equal(3, all.Length);
            Assert.EndsWith("third", all[0]);
            Assert.Contains(Identity, all[0]);
            var limited = (await runtime.Call("git.log", "/repo/", ("limit", 1))).Get<string>().Split('\n');
            Assert.Single(limited);
            var range = (await runtime.Call("git.log", "/repo/", ("range", "HEAD~2..HEAD"))).Get<string>().Split('\n');
            Assert.Equal(2, range.Length);
        }

        [GitFact]
        public async Task DiffShowsChangesAgainstHead()
        {
            using var runtime = new Runtime();
            await runtime.Repo("/repo/");
            File.WriteAllText(runtime.FullPath("repo/a.txt"), "changed");
            File.WriteAllText(runtime.FullPath("repo/b.txt"), "other");
            await runtime.Call("git.commit", "/repo/", ("message", "b"), ("name", Identity), ("email", "t@example.com"));
            File.WriteAllText(runtime.FullPath("repo/a.txt"), "changed again");
            File.WriteAllText(runtime.FullPath("repo/b.txt"), "other again");
            var whole = (await runtime.Call("git.diff", "/repo/")).Get<string>();
            Assert.Contains("+changed again", whole);
            Assert.Contains("+other again", whole);
            var single = (await runtime.Call("git.diff", "/repo/", ("file", "b.txt"))).Get<string>();
            Assert.Contains("+other again", single);
            Assert.DoesNotContain("+changed again", single);
        }

        #endregion

        #region [ -- Branches, merging and restoring -- ]

        [GitFact]
        public async Task CheckoutCreatesAndSwitchesBranchesAndBranchListShowsThem()
        {
            using var runtime = new Runtime();
            await runtime.Repo("/repo/");
            await runtime.Call("git.checkout", "/repo/", ("branch", "feature"), ("create", true));
            var branches = await runtime.Call("git.branch.list", "/repo/");
            Assert.Equal(["feature", "main"], branches.Children.Select(x => x.Get<string>()).OrderBy(x => x).ToArray());
            await runtime.Call("git.checkout", "/repo/", ("branch", "main"));
            var status = await runtime.Call("git.status", "/repo/", ("porcelain", true), ("branch", true));
            Assert.StartsWith("## main", status.Get<string>());
        }

        [GitFact]
        public async Task CheckoutRequiresABranchAndAKnownOne()
        {
            using var runtime = new Runtime();
            await runtime.Repo("/repo/");
            Assert.Contains("'branch'", (await Assert.ThrowsAsync<HyperlambdaException>(() => runtime.Call("git.checkout", "/repo/"))).Message);
            await Assert.ThrowsAsync<HyperlambdaException>(() => runtime.Call("git.checkout", "/repo/", ("branch", "nope")));
        }

        [GitFact]
        public async Task BranchListWithAllAndRemoteFlags()
        {
            using var runtime = new Runtime();
            await runtime.Repo("/repo/");
            var all = await runtime.Call("git.branch.list", "/repo/", ("all", true));
            Assert.Contains("main", all.Children.Select(x => x.Get<string>()));
            var remote = await runtime.Call("git.branch.list", "/repo/", ("remote", true));
            Assert.Empty(remote.Children);
        }

        [GitFact]
        public async Task MergeBringsInAnotherBranch()
        {
            using var runtime = new Runtime();
            await runtime.Repo("/repo/");
            await runtime.Call("git.checkout", "/repo/", ("branch", "feature"), ("create", true));
            File.WriteAllText(runtime.FullPath("repo/feature.txt"), "feature");
            await runtime.Commit("/repo/", "feature work");
            await runtime.Call("git.checkout", "/repo/", ("branch", "main"));
            Assert.False(File.Exists(runtime.FullPath("repo/feature.txt")));
            await runtime.Call("git.merge", "/repo/", ("branch", "feature"), ("name", Identity), ("email", "t@example.com"));
            Assert.True(File.Exists(runtime.FullPath("repo/feature.txt")));
        }

        [GitFact]
        public async Task MergeConflictThrowsAndCanBeAborted()
        {
            using var runtime = new Runtime();
            await runtime.Repo("/repo/");
            await runtime.Call("git.checkout", "/repo/", ("branch", "feature"), ("create", true));
            File.WriteAllText(runtime.FullPath("repo/a.txt"), "from feature");
            await runtime.Commit("/repo/", "feature edit");
            await runtime.Call("git.checkout", "/repo/", ("branch", "main"));
            File.WriteAllText(runtime.FullPath("repo/a.txt"), "from main");
            await runtime.Commit("/repo/", "main edit");

            await Assert.ThrowsAsync<HyperlambdaException>(() =>
                runtime.Call("git.merge", "/repo/", ("branch", "feature"), ("name", Identity), ("email", "t@example.com")));
            var conflicted = await runtime.Call("git.status", "/repo/", ("porcelain", true));
            Assert.StartsWith("UU", conflicted.Get<string>());

            await runtime.Call("git.merge", "/repo/", ("abort", true));
            var after = await runtime.Call("git.status", "/repo/", ("porcelain", true));
            Assert.True(string.IsNullOrEmpty(after.Get<string>()));
            Assert.Equal("from main", File.ReadAllText(runtime.FullPath("repo/a.txt")));
        }

        [GitFact]
        public async Task MergeRequiresABranchUnlessAborting()
        {
            using var runtime = new Runtime();
            await runtime.Repo("/repo/");
            Assert.Contains("'branch'", (await Assert.ThrowsAsync<HyperlambdaException>(() => runtime.Call("git.merge", "/repo/"))).Message);
        }

        [GitFact]
        public async Task RestoreOfAFileBringsBackItsCommittedContent()
        {
            using var runtime = new Runtime();
            await runtime.Repo("/repo/");
            File.WriteAllText(runtime.FullPath("repo/a.txt"), "spoiled");
            await runtime.Call("git.restore", "/repo/", ("file", "a.txt"));
            Assert.Equal("one", File.ReadAllText(runtime.FullPath("repo/a.txt")));
        }

        [GitFact]
        public async Task RestoreOfTheWholeRepositoryAlsoRemovesUntrackedFiles()
        {
            using var runtime = new Runtime();
            await runtime.Repo("/repo/");
            File.WriteAllText(runtime.FullPath("repo/a.txt"), "spoiled");
            File.WriteAllText(runtime.FullPath("repo/junk.txt"), "junk");
            Directory.CreateDirectory(runtime.FullPath("repo/junkdir"));
            File.WriteAllText(runtime.FullPath("repo/junkdir/x.txt"), "x");
            await runtime.Call("git.restore", "/repo/");
            Assert.Equal("one", File.ReadAllText(runtime.FullPath("repo/a.txt")));
            Assert.False(File.Exists(runtime.FullPath("repo/junk.txt")));
            Assert.False(Directory.Exists(runtime.FullPath("repo/junkdir")));
        }

        #endregion
    }
}
